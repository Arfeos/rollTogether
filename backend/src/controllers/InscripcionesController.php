<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Database\Database;
use Firebase\JWT\JWT;
use PDO;

class InscripcionesController
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function getAll(Request $request, Response $response): Response
    {
        $stmt = $this->db->query("
            SELECT i.*, u.nombre as usuario_nombre, p.titulo as partida_titulo
            FROM inscripciones i
            JOIN usuarios u ON i.id_usuario = u.id
            JOIN partidas p ON i.id_partida = p.id
        ");
        $inscripciones = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $response->getBody()->write(json_encode($inscripciones));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getByUsuario(Request $request, Response $response, array $args): Response
    {
        $id_usuario = $args['id_usuario'];
        $stmt = $this->db->prepare("
    SELECT i.*, p.titulo, p.fecha, p.ubicacion, p.portada, p.aforo_max, p.plazas_ocupadas,
    u.nombre as nombre_creador, u.foto_perfil
    FROM inscripciones i
    JOIN partidas p ON i.id_partida = p.id
    JOIN usuarios u ON p.id_creador = u.id
    WHERE i.id_usuario = :id_usuario AND p.estado= 'activo';
");
        $stmt->bindParam(':id_usuario', $id_usuario);
        $stmt->execute();
        $inscripciones = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $response->getBody()->write(json_encode($inscripciones));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getByPartida(Request $request, Response $response, array $args): Response
    {
        $id_partida = $args['id_partida'];
        $stmt = $this->db->prepare("
            SELECT i.*, u.nombre, u.foto_perfil, u.email
            FROM inscripciones i
            JOIN usuarios u ON i.id_usuario = u.id
            WHERE i.id_partida = :id_partida
        ");
        $stmt->bindParam(':id_partida', $id_partida);
        $stmt->execute();
        $inscripciones = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $response->getBody()->write(json_encode($inscripciones));
        return $response->withHeader('Content-Type', 'application/json');
    }
    public function checkautenticado(Request $request, Response $response, array $args): Response
{
    $id_partida = $args['id_partida'];

    $tokenData = $request->getAttribute('decoded_token_data');
    if (!$tokenData) {
        $response->getBody()->write(json_encode(['error' => 'No autenticado']));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
    }
    $id_usuario = $tokenData['sub'];
    $stmt = $this->db->prepare("
        SELECT COUNT(*) as count
        FROM inscripciones
        WHERE id_partida = :id_partida AND id_usuario = :id_usuario
    ");
    $stmt->bindParam(':id_partida', $id_partida);
    $stmt->bindParam(':id_usuario', $id_usuario);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    $inscrito = $result['count'] > 0;

    $response->getBody()->write(json_encode(['inscrito' => $inscrito]));
    return $response->withHeader('Content-Type', 'application/json');
}

    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        // Verificar si ya existe la inscripción
        $check = $this->db->prepare("
            SELECT * FROM inscripciones 
            WHERE id_usuario = :id_usuario AND id_partida = :id_partida
        ");
        $check->bindParam(':id_usuario', $data['id_usuario']);
        $check->bindParam(':id_partida', $data['id_partida']);
        $check->execute();

        if ($check->rowCount() > 0) {
            $response->getBody()->write(json_encode(['error' => 'El usuario ya está inscrito en esta partida']));
            return $response->withStatus(400);
        }

        // Verificar plazas disponibles
        $partida = $this->db->prepare("
            SELECT aforo_max, plazas_ocupadas FROM partidas WHERE id = :id_partida
        ");
        $partida->bindParam(':id_partida', $data['id_partida']);
        $partida->execute();
        $partida = $partida->fetch(PDO::FETCH_ASSOC);

        if ($partida['plazas_ocupadas'] >= $partida['aforo_max']) {
            $response->getBody()->write(json_encode(['error' => 'No hay plazas disponibles en esta partida']));
            return $response->withStatus(400);
        }

        // Crear la inscripción
        $stmt = $this->db->prepare("
            INSERT INTO inscripciones (id_usuario, id_partida)
            VALUES (:id_usuario, :id_partida)
        ");
        $stmt->bindParam(':id_usuario', $data['id_usuario']);
        $stmt->bindParam(':id_partida', $data['id_partida']);

        if ($stmt->execute()) {
            // Actualizar plazas ocupadas
            $update = $this->db->prepare("
                UPDATE partidas 
                SET plazas_ocupadas = plazas_ocupadas + 1 
                WHERE id = :id_partida
            ");
            $update->bindParam(':id_partida', $data['id_partida']);
            $update->execute();

            $response->getBody()->write(json_encode(['message' => 'Inscripción creada']));
            return $response->withStatus(201);
        }

        $response->getBody()->write(json_encode(['error' => 'Error al crear inscripción']));
        return $response->withStatus(500);
    }

    public function delete(Request $request, Response $response, array $args): Response
    {
$authHeader = $request->getHeaderLine('Authorization');
    if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $response->getBody()->write(json_encode(["error" => "Token no proporcionado"]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
    }

    $token = $matches[1];

    try {
        $decoded = JWT::decode($token, new \Firebase\JWT\Key($_ENV['SECRET_KEY'], 'HS256'));
        $id_usuario = $decoded->sub;
        
    } catch (\Exception $e) {
        $response->getBody()->write(json_encode(["error" => "Token inválido o expirado"]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
    }
        $id_partida = $args['id_partida'];

        $check = $this->db->prepare("
            SELECT * FROM inscripciones 
            WHERE id_usuario = :id_usuario AND id_partida = :id_partida
        ");
        $check->bindParam(':id_usuario', $id_usuario);
        $check->bindParam(':id_partida', $id_partida);
        $check->execute();

        if ($check->rowCount() === 0) {
            $response->getBody()->write(json_encode(['error' => 'Inscripción no encontrada o ya cancelada']));
            return $response->withStatus(404);
        }

        $stmt = $this->db->prepare("
            DELETE FROM inscripciones 
            WHERE id_usuario = :id_usuario AND id_partida = :id_partida
        ");
        $stmt->bindParam(':id_usuario', $id_usuario);
        $stmt->bindParam(':id_partida', $id_partida);

        if ($stmt->execute()) {
            $update = $this->db->prepare("
                UPDATE partidas 
                SET plazas_ocupadas = plazas_ocupadas - 1 
                WHERE id = :id_partida
            ");
            $update->bindParam(':id_partida', $id_partida);
            $update->execute();

            $response->getBody()->write(json_encode(['message' => 'Inscripción cancelada']));
            return $response;
        }

        $response->getBody()->write(json_encode(['error' => 'Error al cancelar inscripción']));
        return $response->withStatus(500);
    }
    public function deleteUser(Request $request, Response $response, array $args): Response
    {
        $id_usuario = $args['id_usuario'];
        $id_partida = $args['id_partida'];

        $check = $this->db->prepare("
            SELECT * FROM inscripciones 
            WHERE id_usuario = :id_usuario AND id_partida = :id_partida
        ");
        $check->bindParam(':id_usuario', $id_usuario);
        $check->bindParam(':id_partida', $id_partida);
        $check->execute();

        if ($check->rowCount() === 0) {
            $response->getBody()->write(json_encode(['error' => 'Inscripción no encontrada o ya cancelada']));
            return $response->withStatus(404);
        }

        $stmt = $this->db->prepare("
            DELETE FROM inscripciones 
            WHERE id_usuario = :id_usuario AND id_partida = :id_partida
        ");
        $stmt->bindParam(':id_usuario', $id_usuario);
        $stmt->bindParam(':id_partida', $id_partida);

        if ($stmt->execute()) {
            $update = $this->db->prepare("
                UPDATE partidas 
                SET plazas_ocupadas = plazas_ocupadas - 1 
                WHERE id = :id_partida
            ");
            $update->bindParam(':id_partida', $id_partida);
            $update->execute();

            $response->getBody()->write(json_encode(['message' => 'Inscripción cancelada']));
            return $response;
        }

        $response->getBody()->write(json_encode(['error' => 'Error al cancelar inscripción']));
        return $response->withStatus(500);
    }
}

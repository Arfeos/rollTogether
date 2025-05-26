<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Database\Database;
use PDO;
use Firebase\JWT\JWT;

class PartidasController
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function getAll(Request $request, Response $response): Response
    {
        $stmt = $this->db->query("
            SELECT p.*, u.nombre as creador_nombre, c.nombre as categoria_nombre,u.foto_perfil as foto_usuario, s.nombre as sistema_nombre 
            FROM partidas p
            JOIN usuarios u ON p.id_creador = u.id
            JOIN categorias c ON p.id_categoria = c.id
            JOIN sistemas_juego s ON p.id_sistema = s.id
            WHERE p.estado='activo'
        ");
        $partidas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $response->getBody()->write(json_encode($partidas));
        return $response->withHeader('Content-Type', 'application/json');
    }
    public function getAllAdmin(Request $request, Response $response): Response
    {
        $stmt = $this->db->query("
            SELECT p.*, u.nombre as creador_nombre, c.nombre as categoria_nombre,u.foto_perfil as foto_usuario, s.nombre as sistema_nombre, p.aforo_max
            FROM partidas p
            JOIN usuarios u ON p.id_creador = u.id
            JOIN categorias c ON p.id_categoria = c.id
            JOIN sistemas_juego s ON p.id_sistema = s.id
        ");
        $partidas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $response->getBody()->write(json_encode($partidas));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getById(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'];
        $stmt = $this->db->prepare("
            SELECT p.*, u.nombre as creador_nombre, c.nombre as categoria_nombre,u.foto_perfil ,s.nombre as sistema_nombre 
            FROM partidas p
            JOIN usuarios u ON p.id_creador = u.id
            JOIN categorias c ON p.id_categoria = c.id
            JOIN sistemas_juego s ON p.id_sistema = s.id
            WHERE p.id = :id
        ");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $partida = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$partida) {
            $response->getBody()->write(json_encode(['error' => 'Partida no encontrada']));
            return $response->withStatus(404);
        }

        $response->getBody()->write(json_encode($partida));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function create(Request $request, Response $response): Response
    {
        $uploadedFile = $request->getUploadedFiles()['portada'] ?? null;

        $data = $_POST;


        if (empty($data['titulo']) || empty($data['descripcion']) || empty($data['id_creador'])) {
            $response->getBody()->write(json_encode(['error' => 'Faltan campos obligatorios']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        // Manejo de la imagen de portada
        $portada = '';
        if ($uploadedFile && $uploadedFile->getError() === UPLOAD_ERR_OK) {
            $extension = pathinfo($uploadedFile->getClientFilename(), PATHINFO_EXTENSION);
            $nombreArchivo = uniqid() . '.' . $extension;
            $directorioDestino = __DIR__ . '/../../../assets/partidasPortada';

            if (!is_dir($directorioDestino)) {
                mkdir($directorioDestino, 0777, true);
            }

            $uploadedFile->moveTo($directorioDestino . DIRECTORY_SEPARATOR . $nombreArchivo);
            $portada = $nombreArchivo;
        }

        // Preparar los valores para bindParam()
        $titulo = $data['titulo'];
        $descripcion = $data['descripcion'];
        $tipo = $data['tipo'];
        $id_sistema = $data['id_sistema'];
        $id_categoria = $data['id_categoria'];
        $aforo_max = $data['aforo_max'];
        $plazas_ocupadas = $data['plazas_ocupadas'] ?? 0;
        $fecha = $data['fecha'];
        $ubicacion = $data['ubicacion'];
        $id_creador = $data['id_creador'];
        $estado = $data['estado'] ?? 'activo';

        $sql = "INSERT INTO partidas (
                titulo, descripcion, portada, aforo_max, plazas_ocupadas, fecha, ubicacion,
                id_creador, id_categoria, id_sistema, estado, tipo
            ) VALUES (
                :titulo, :descripcion, :portada, :aforo_max, :plazas_ocupadas, :fecha, :ubicacion,
                :id_creador, :id_categoria, :id_sistema, :estado, :tipo
            )";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':titulo', $titulo);
        $stmt->bindParam(':descripcion', $descripcion);
        $stmt->bindParam(':portada', $portada);
        $stmt->bindParam(':aforo_max', $aforo_max);
        $stmt->bindParam(':plazas_ocupadas', $plazas_ocupadas);
        $stmt->bindParam(':fecha', $fecha);
        $stmt->bindParam(':ubicacion', $ubicacion);
        $stmt->bindParam(':id_creador', $id_creador);
        $stmt->bindParam(':id_categoria', $id_categoria);
        $stmt->bindParam(':id_sistema', $id_sistema);
        $stmt->bindParam(':estado', $estado);
        $stmt->bindParam(':tipo', $tipo);

        if ($stmt->execute()) {
            $partidaId = $this->db->lastInsertId();
            $response->getBody()->write(json_encode([
                'message' => 'Partida creada exitosamente',
                'id' => $partidaId,
                'portada' => $portada
            ]));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        }

        $response->getBody()->write(json_encode(['error' => 'Error al crear partida']));
        return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
    }
    public function update(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'];
        $data = json_decode($request->getBody()->getContents(), true);

        // Validación mínima
        if (!isset($data['titulo']) || !isset($data['descripcion'])) {
            $response->getBody()->write(json_encode(['error' => 'Faltan campos obligatorios']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $sql = "UPDATE partidas SET 
                titulo = :titulo,
                descripcion = :descripcion,
                aforo_max = :aforo_max,
                fecha = :fecha,
                ubicacion = :ubicacion,
                id_categoria = :id_categoria,
                id_sistema = :id_sistema,
                tipo = :tipo
            WHERE id = :id";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':titulo', $data['titulo']);
        $stmt->bindParam(':descripcion', $data['descripcion']);
        $stmt->bindParam(':aforo_max', $data['aforoMaximo']);
        $stmt->bindParam(':fecha', $data['fecha']);
        $stmt->bindParam(':ubicacion', $data['ubicacion']);
        $stmt->bindParam(':id_categoria', $data['categoria']);
        $stmt->bindParam(':id_sistema', $data['sistema']);
        $stmt->bindParam(':tipo', $data['tipoPartida']);
        $stmt->bindParam(':id', $id);

        if ($stmt->execute()) {
            $response->getBody()->write(json_encode(['message' => 'Partida actualizada correctamente']));
            return $response->withHeader('Content-Type', 'application/json');
        }

        $response->getBody()->write(json_encode(['error' => 'Error al actualizar la partida']));
        return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
    }
    public function subirPortada(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'];
        $uploadedFile = $request->getUploadedFiles()['portada'] ?? null;

        if (!$uploadedFile || $uploadedFile->getError() !== UPLOAD_ERR_OK) {
            $response->getBody()->write(json_encode(['error' => 'Error al subir la imagen']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $extension = pathinfo($uploadedFile->getClientFilename(), PATHINFO_EXTENSION);
        $nombreArchivo = uniqid() . '.' . $extension;
        $directorioDestino = __DIR__ . '/../../../assets/partidasPortada';

        if (!is_dir($directorioDestino)) {
            mkdir($directorioDestino, 0777, true);
        }

        $uploadedFile->moveTo($directorioDestino . DIRECTORY_SEPARATOR . $nombreArchivo);

        // Actualizar el nombre de la portada en la BD
        $stmt = $this->db->prepare("UPDATE partidas SET portada = :portada WHERE id = :id");
        $stmt->bindParam(':portada', $nombreArchivo);
        $stmt->bindParam(':id', $id);

        if ($stmt->execute()) {
            $response->getBody()->write(json_encode(['success' => true]));
            return $response->withHeader('Content-Type', 'application/json');
        }

        $response->getBody()->write(json_encode(['error' => 'Error al guardar la imagen en la base de datos']));
        return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
    }

    public function getPortada(Request $request, Response $response, array $args): Response
    {
        $nombreArchivo = $args['nombre'];
        $rutaImagen = '/../assets/partidasPortada/' . $nombreArchivo;

        if (!file_exists($rutaImagen)) {
            $response->getBody()->write(json_encode(['error' => 'Imagen no encontrada']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        $stream = fopen($rutaImagen, 'rb');
        $response = $response->withBody(new \Slim\Psr7\Stream($stream));

        $mimeType = mime_content_type($rutaImagen);

        return $response
            ->withHeader('Content-Type', $mimeType)
            ->withHeader('Content-Disposition', 'inline; filename="' . $nombreArchivo . '"')
            ->withStatus(200);
    }
    public function delete(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'];
        $stmt = $this->db->prepare("DELETE FROM partidas WHERE id = :id");
        $stmt->bindParam(':id', $id);

        if ($stmt->execute()) {
            $response->getBody()->write(json_encode(['message' => 'Partida eliminada']));
            return $response;
        }

        $response->getBody()->write(json_encode(['error' => 'Error al eliminar partida']));
        return $response->withStatus(500);
    }
    public function cambiarEstado(Request $request, Response $response, array $args): Response
    {
        $id = (int)$args['id'];

        $authHeader = $request->getHeaderLine('Authorization');
    if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $response->getBody()->write(json_encode(["error" => "Token no proporcionado"]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
    }

    $token = $matches[1];

    try {
        $decoded = JWT::decode($token, new \Firebase\JWT\Key($_ENV['SECRET_KEY'], 'HS256'));
            $rol = $decoded->rol ?? 'usuario';
        } catch (\Exception $e) {
            $payload = ['error' => 'Token inválido'];
            $response->getBody()->write(json_encode($payload));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }

        // Obtener estado actual de la partida
        $stmt = $this->db->prepare("SELECT estado FROM partidas WHERE id = :id");
        $stmt->bindParam(':id', $id, \PDO::PARAM_INT);
        $stmt->execute();
        $partida = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$partida) {
            $payload = ['error' => 'Partida no encontrada'];
            $response->getBody()->write(json_encode($payload));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        $estadoActual = $partida['estado'];
        $nuevoEstado = null;

        if ($rol === 'admin') {
            if ($estadoActual === 'activo') {
                $nuevoEstado = 'inactivo';
            } else {
                $nuevoEstado = 'activo';
            }
        } else {
            if ($estadoActual === 'activo') {
                $nuevoEstado = 'oculta';
            } elseif ($estadoActual === 'oculta') {
                $nuevoEstado = 'activo';
            } elseif ($estadoActual === 'inactivo') {
                $payload = ['error' => 'No tienes permiso para editar partidas inactivas. Contacta con un administrador.'];
                $response->getBody()->write(json_encode($payload));
                return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
            } else {
                $payload = ['error' => 'Estado no válido'];
                $response->getBody()->write(json_encode($payload));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
        }
        $Stmt = $this->db->prepare("UPDATE partidas SET estado = :estado WHERE id = :id");
        $Stmt->bindParam(':estado', $nuevoEstado);
        $Stmt->bindParam(':id', $id, \PDO::PARAM_INT);
        $Stmt->execute();

        $payload = [
            'message' => 'Estado actualizado correctamente',
            'nuevo_estado' => $nuevoEstado
        ];

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json');
    }
}

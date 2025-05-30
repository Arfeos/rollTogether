<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Database\Database;
use PDO;

class SistemasJuegoController
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function getAll(Request $request, Response $response): Response
    {
        $stmt = $this->db->query("SELECT * FROM sistemas_juego");
        $sistemas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $response->getBody()->write(json_encode($sistemas));
        return $response->withHeader('Content-Type', 'application/json');
    }
    public function delete(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'] ?? null;


        $stmt = $this->db->prepare("SELECT COUNT(*) FROM partidas WHERE id_sistema = :id");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $tienePartidas = $stmt->fetchColumn();

        if ($tienePartidas) {
            $response->getBody()->write(json_encode([
                'error' => 'No se puede eliminar el sistema porque tiene partidas asociadas'
            ]));
            return $response->withStatus(409)->withHeader('Content-Type', 'application/json');
        }

        $stmt = $this->db->prepare("DELETE FROM sistemas_juego WHERE id = :id");
        $stmt->bindParam(':id', $id);

        if ($stmt->execute()) {
            $response->getBody()->write(json_encode([
                'message' => 'Categoría eliminada exitosamente'
            ]));
            return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
        } else {
            $response->getBody()->write(json_encode([
                'error' => 'Error al eliminar la categoría'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        $nombre = trim($data['nombre'] ?? '');
        $descripcion = trim($data['descripcion'] ?? '');
        $aniosalida = trim($data['anio_salida'] ?? '');

        $stmt = $this->db->prepare("SELECT COUNT(*) FROM sistemas_juego WHERE nombre = :nombre");
        $stmt->bindParam(':nombre', $nombre);
        $stmt->execute();
        $existe = $stmt->fetchColumn();

        if ($existe) {
            $response->getBody()->write(json_encode([
                'error' => 'El sistema ya existe.'
            ]));
            return $response->withStatus(409)->withHeader('Content-Type', 'application/json');
        }
        $stmt = $this->db->prepare(" INSERT INTO sistemas_juego (nombre, descripcion, anio_lanzamiento) 
        VALUES (:nombre, :descripcion, :aniosalida)
    ");
        $stmt->bindParam(':nombre', $nombre);
        $stmt->bindParam(':descripcion', $descripcion);
        $stmt->bindParam(':aniosalida', $aniosalida);
        if ($stmt->execute()) {
            $response->getBody()->write(json_encode([
                'message' => 'Sistema creado exitosamente.'
            ]));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        } else {
            $response->getBody()->write(json_encode([
                'error' => 'Error al crear el sistema.'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}

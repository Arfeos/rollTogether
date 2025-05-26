<?php
namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Database\Database;
use PDO;

class SistemasJuegoController {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function getAll(Request $request, Response $response): Response {
        $stmt = $this->db->query("SELECT * FROM sistemas_juego");
        $sistemas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $response->getBody()->write(json_encode($sistemas));
        return $response->withHeader('Content-Type', 'application/json');
    }

   
    public function create(Request $request, Response $response): Response {
        $data = $request->getParsedBody();
        
        $sql = "INSERT INTO sistemas_juego (nombre, descripcion, año_lanzamiento)
                VALUES (:nombre, :descripcion, :año_lanzamiento)";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':nombre', $data['nombre']);
        $stmt->bindParam(':descripcion', $data['descripcion']);
        $stmt->bindParam(':año_lanzamiento', $data['año_lanzamiento']);
        
        if ($stmt->execute()) {
            $sistemaId = $this->db->lastInsertId();
            $response->getBody()->write(json_encode([
                'message' => 'Sistema creado',
                'id' => $sistemaId
            ]));
            return $response->withStatus(201);
        }
        
        $response->getBody()->write(json_encode(['error' => 'Error al crear sistema']));
        return $response->withStatus(500);
    }
}
<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Database\Database;
use PDO;

class CategoriasController
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function getAll(Request $request, Response $response): Response
    {
        $stmt = $this->db->query("SELECT * FROM categorias");
        $categorias = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $response->getBody()->write(json_encode($categorias));
        return $response->withHeader('Content-Type', 'application/json');
    }


    public function create(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $nombre = trim($data['nombre'] ?? '');
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM categorias WHERE nombre = :nombre");
        $stmt->bindParam(':nombre', $nombre);
        $stmt->execute();
        $existe = $stmt->fetchColumn();

        if ($existe) {
            $response->getBody()->write(json_encode([
                'error' => 'La categoría ya existe.'
            ]));
            return $response->withStatus(409)->withHeader('Content-Type', 'application/json');
        }


        $stmt = $this->db->prepare("INSERT INTO categorias (nombre) VALUES (:nombre)");
        $stmt->bindParam(':nombre', $nombre);

        if ($stmt->execute()) {
            $response->getBody()->write(json_encode([
                'message' => 'Categoría creada exitosamente.'
            ]));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        } else {
            $response->getBody()->write(json_encode([
                'error' => 'Error al crear la categoría.'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}

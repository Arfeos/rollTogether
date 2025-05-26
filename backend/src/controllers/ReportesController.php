<?php
namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Database\Database;
use PDO;

class ReportesController {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function getAll(Request $request, Response $response): Response {
        $queryParams = $request->getQueryParams();
        $estado = $queryParams['estado'] ?? null;
        
        $sql = "SELECT * FROM reportes";
        if ($estado) {
            $sql .= " WHERE estado = :estado";
        }
        
        $stmt = $this->db->prepare($sql);
        if ($estado) {
            $stmt->bindParam(':estado', $estado);
        }
        $stmt->execute();
        
        $reportes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $response->getBody()->write(json_encode($reportes));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getById(Request $request, Response $response, array $args): Response {
        $id = $args['id'];
        $stmt = $this->db->prepare("SELECT * FROM reportes WHERE id = :id");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $reporte = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$reporte) {
            $response->getBody()->write(json_encode(['error' => 'Reporte no encontrado']));
            return $response->withStatus(404);
        }
        
        $response->getBody()->write(json_encode($reporte));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function create(Request $request, Response $response): Response {
        $data = $request->getParsedBody();
        
        $sql = "INSERT INTO reportes (nombre, email, asunto, descripcion)
                VALUES (:nombre, :email, :asunto, :descripcion)";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':nombre', $data['nombre']);
        $stmt->bindParam(':email', $data['email']);
        $stmt->bindParam(':asunto', $data['asunto']);
        $stmt->bindParam(':descripcion', $data['descripcion']);
        
        if ($stmt->execute()) {
                    // Configuración de Mailjet
        $mj = new \Mailjet\Client(
            $_ENV['MAILJET_PK'],
            $_ENV['MAILJET_SK'],
            true,
            ['version' => 'v3.1']
        );

        $body = [
            'Messages' => [
                [
                    'From' => [
                        'Email' => "supp.rolltogether@gmail.com",
                        'Name' => "Soporte RollTogether"
                    ],
                    'To' => [
                        [
                            'Email' => "supp.rolltogether@gmail.com",
                            'Name' => "Soporte RollTogether"
                        ]
                    ],
                    'Subject' => "Nuevo reporte de usuario - {$data['asunto']}",
                    'HTMLPart' => "<h3>Nuevo Reporte creado</h3>
                                   <p><strong>nombre:</strong>{$data['nombre']}</p>
                                   <p><strong>email de contacto:</strong> {$data['email']}</p>
                                   <p><strong>mensaje:</strong> {$data['descripcion']}</p>"
                    
                ]
            ]
        ];

        $mailResponse = $mj->post(\Mailjet\Resources::$Email, ['body' => $body]);

        if ($mailResponse->success()) {
            $response->getBody()->write(json_encode([
                'mensaje' => 'Si el correo existe, recibirás un correo con la nueva contraseña'
            ]));
            return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
        } else {
            error_log('Error Mailjet: ' . print_r($mailResponse->getData(), true));
            throw new \Exception('Error al enviar el correo de recuperación');
        }
            $reporteId = $this->db->lastInsertId();
            $response->getBody()->write(json_encode([
                'message' => 'Reporte creado',
                'id' => $reporteId
            ]));
            return $response->withStatus(201);
        }
        
        $response->getBody()->write(json_encode(['error' => 'Error al crear reporte']));
        return $response->withStatus(500);
    }

    public function updateStatus(Request $request, Response $response, array $args): Response {
        $id = $args['id'];
        $data = $request->getParsedBody();
        
        $stmt = $this->db->prepare("
            UPDATE reportes 
            SET estado = :estado 
            WHERE id = :id
        ");
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':estado', $data['estado']);
        
        if ($stmt->execute()) {
            $response->getBody()->write(json_encode(['message' => 'Estado del reporte actualizado']));
            return $response;
        }
        
        $response->getBody()->write(json_encode(['error' => 'Error al actualizar reporte']));
        return $response->withStatus(500);
    }

    public function delete(Request $request, Response $response, array $args): Response {
        $id = $args['id'];
        $stmt = $this->db->prepare("DELETE FROM reportes WHERE id = :id");
        $stmt->bindParam(':id', $id);
        
        if ($stmt->execute()) {
            $response->getBody()->write(json_encode(['message' => 'Reporte eliminado']));
            return $response;
        }
        
        $response->getBody()->write(json_encode(['error' => 'Error al eliminar reporte']));
        return $response->withStatus(500);
    }
}
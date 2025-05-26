<?php
namespace App\Middleware;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as Handler;
use Slim\Psr7\Response;
use App\Database\Database;
use Slim\Routing\RouteContext;
use PDO;

class DuenioPartidaOAdministradorMiddle
{
    private $db;

    public function __construct()
    {
       $this->db = Database::getInstance();
    }

    public function __invoke(Request $request, Handler $handler): Response
    {
        $tokenData = $request->getAttribute('decoded_token_data');
        
        if (!$tokenData) {
            return $this->jsonResponse(['error' => 'No autenticado'], 401);
        }
        
        $routeContext = RouteContext::fromRequest($request);
        $route = $routeContext->getRoute();
        
        if (!$route) {
            return $this->jsonResponse(['error' => 'Ruta no encontrada'], 404);
        }
        
        // Obtener el ID del recurso (partida en este caso)
        $idPartida = $route->getArgument('id')?: $route->getArgument('id_partida');
        
        if (!$idPartida) {
            return $this->jsonResponse(['error' => 'ID no proporcionado'], 400);
        }
        
        // Verificar si el usuario es admin
        $isAdmin = $tokenData['rol'] === 'admin';
        
        // Si no es admin, comprobamos si es el dueño de la partida
        if (!$isAdmin) {
            $stmt = $this->db->prepare("
                SELECT id_creador FROM partidas WHERE id = :id
            ");
            $stmt->bindParam(':id', $idPartida, PDO::PARAM_INT);
            $stmt->execute();
            $partida = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$partida) {
                return $this->jsonResponse(['error' => 'Partida no encontrada'], 404);
            }
            
            $isOwner = $tokenData['sub'] == $partida['id_creador'];
            
            if (!$isOwner) {
                return $this->jsonResponse(['error' => 'No tienes permisos'], 403);
            }
        }
        
        return $handler->handle($request);
    }

    private function jsonResponse(array $data, int $statusCode): Response
    {
        $response = new Response();
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json')
                        ->withStatus($statusCode);
    }
}

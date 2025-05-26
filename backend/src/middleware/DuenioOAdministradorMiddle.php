<?php
namespace App\Middleware;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as Handler;
use Slim\Psr7\Response;
use Slim\Routing\RouteContext;

class DuenioOAdministradorMiddle
{
    public function __invoke(Request $request, Handler $handler): Response
    {
        $tokenData = $request->getAttribute('decoded_token_data');
        
        if (!$tokenData) {
            $response = new Response();
            $response->getBody()->write(json_encode(['error' => 'No autenticado']));
            return $response->withHeader('Content-Type', 'application/json')
                           ->withStatus(401);
        }
        
        // Obtener la ruta usando RouteContext
        $routeContext = RouteContext::fromRequest($request);
        $route = $routeContext->getRoute();
        
        if (!$route) {
            $response = new Response();
            $response->getBody()->write(json_encode(['error' => 'Ruta no encontrada']));
            return $response->withHeader('Content-Type', 'application/json')
                           ->withStatus(404);
        }
        
        // Obtener el ID del parámetro de la ruta
        $id = $route->getArgument('id') ?? $route->getArgument('id_usuario');
        
        if (!$id) {
            $response = new Response();
            $response->getBody()->write(json_encode(['error' => 'ID no proporcionado']));
            return $response->withHeader('Content-Type', 'application/json')
                           ->withStatus(400);
        }
        
        // Verificar si es admin o el dueño del recurso
        $isAdmin = $tokenData['rol'] === 'admin';
        $isOwner = $tokenData['sub'] == $id;
        
        if (!$isAdmin && !$isOwner) {
            $response = new Response();
            $response->getBody()->write(json_encode(['error' => 'No tienes permisos']));
            return $response->withHeader('Content-Type', 'application/json')
                           ->withStatus(403);
        }
        
        return $handler->handle($request);
    }
}
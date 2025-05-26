<?php
namespace App\Middleware;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as Handler;
use Slim\Psr7\Response;

class AdministradorMiddleware
{
    public function __invoke(Request $request, Handler $handler): Response
    {
        $tokenData = $request->getAttribute('decoded_token_data');
        
        if (!$tokenData || $tokenData['rol'] !== 'admin') {
            $response = new Response();
            $response->getBody()->write(json_encode(['error' => 'Se requieren privilegios de administrador'.$tokenData['rol']]));
            return $response->withHeader('Content-Type', 'application/json')
                            ->withStatus(403);
        }
        
        return $handler->handle($request);
    }
}
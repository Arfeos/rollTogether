<?php
namespace App\Middleware;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as Handler;
use Slim\Psr7\Response;

class autenticadoMiddleware
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
        
        return $handler->handle($request);
    }
}
<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use Tuupola\Middleware\JwtAuthentication;

require __DIR__ . '/../vendor/autoload.php';

// Cargar variables de entorno
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Crear la app
$app = AppFactory::create();

// Middleware de errores
$app->addErrorMiddleware(true, true, true);
$app->addBodyParsingMiddleware();

// Middleware CORS
// Middleware CORS (debe ir ANTES del middleware JWT)
$app->add(function ($request, $handler) {
    $response = $handler->handle($request);
    
    return $response
        ->withHeader('Access-Control-Allow-Origin', '*') // O especifica tu dominio: 'http://localhost:4200'
        ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
        ->withHeader('Access-Control-Allow-Credentials', 'true');
});

// Middleware de JWT
$app->add(new JwtAuthentication([
    "rules" => [
        new Tuupola\Middleware\JwtAuthentication\RequestPathRule([
            "path" => "/api"
        ]),
        new Tuupola\Middleware\JwtAuthentication\RequestMethodRule([
            "ignore" => ["OPTIONS"]
        ]),
        function ($request) {
               $path = $request->getUri()->getPath();
    $method = $request->getMethod();

    $publicRoutes = [
        ['GET', '#^/api/partidas(/\d+)?$#'],          // /api/partidas o /api/partidas/123
        ['POST', '#^/api/reportes$#'],
        ['GET', '#^/api/sistemas$#'],
        ['GET', '#^/api/categorias$#'],
        ['POST', '#^/api/login$#'],
        ['POST', '#^/api/registro$#'],
        ['POST', '#^/api/recuperar$#'],
        ['GET', '#^/api/fotos/usuario(?:/[^/]+)?$#'],
        ['GET', '#^/api/fotos/portada(?:/[^/]+)?$#']
    ];

    foreach ($publicRoutes as [$allowedMethod, $regex]) {
        if ($method === $allowedMethod && preg_match($regex, $path)) {
            return false; // No requiere token
        }
    }
    return true;
        }
    ],
    "secret" => $_ENV['JWT_SECRET'] ?? $_ENV['SECRET_KEY'],
    "attribute" => "decoded_token_data",
    "error" => function ($response, $arguments) {
        $data = ['error' => 'No autorizado', 'message' => $arguments['message']];
        $response->getBody()->write(json_encode($data));
        return $response->withHeader("Content-Type", "application/json")
            ->withStatus(401);
    }
]));

// Manejar preflight OPTIONS requests
$app->options('/{routes:.+}', function ($request, $response) {
    return $response;
});

// Registrar rutas
(require __DIR__ . '/../src/Routes/ApiRoutes.php')($app);

// Ejecutar la app
$app->run();

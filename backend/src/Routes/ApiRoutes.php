<?php
use Slim\Routing\RouteCollectorProxy;
use App\Controllers\{
    UsuariosController,
    CategoriasController,
    PartidasController,
    InscripcionesController,
    ReportesController,
    SistemasJuegoController
};
use App\Middleware\{
    AdministradorMiddleware,
    DuenioOAdministradorMiddle,
    DuenioPartidaOAdministradorMiddle,
    autenticadoMiddleware,

};

return function ($app) {
    // Grupo base para API
    $app->group('/api', function (RouteCollectorProxy $group) {
        
        // Login y registro (públicos)
        $group->post('/login', [UsuariosController::class, 'login']);
        $group->post('/registro', [UsuariosController::class, 'create']);
        $group->post('/recuperar', [UsuariosController::class, 'recuperarContrasenia']);
        
        $group->get('/fotos/usuario/{nombre}', [UsuariosController::class, 'getFotoPerfil']);
        $group->get('/fotos/portada/{nombre}', [PartidasController::class, 'getPortada']);
        $group->get('/refrescar',[UsuariosController::class, 'refrescarToken'])->add(new autenticadoMiddleware());
        // Usuarios
        $group->group('/usuarios', function (RouteCollectorProxy $group) {
            $group->get('', [UsuariosController::class, 'getAll'])->add(new AdministradorMiddleware());
            
            // Rutas públicas    
            $group->get('/{id}', [UsuariosController::class, 'getById']);
            
            // Rutas protegidas (requieren autenticación)
            $group->post('/{id}/foto', [UsuariosController::class, 'subirFoto'])->add(new DuenioOAdministradorMiddle());
            $group->get('/{id}/partidas', [UsuariosController::class, 'getPartidasByUsuario'])->add(new DuenioOAdministradorMiddle());  
            $group->put('/{id}', [UsuariosController::class, 'update'])->add(new DuenioOAdministradorMiddle());
            $group->put('/{id}/estado', [UsuariosController::class, 'cambiarestado'])->add(new AdministradorMiddleware());
            $group->delete('/{id}', [UsuariosController::class, 'delete'])->add(new DuenioOAdministradorMiddle());
        });
        
        // Categorias
        $group->group('/categorias', function (RouteCollectorProxy $group) {
            $group->get('', [CategoriasController::class, 'getAll']);
            $group->post('', [CategoriasController::class, 'create'])->add(new AdministradorMiddleware());
        });
        
        // Partidas
             $group->group('/partidas', function (RouteCollectorProxy $group) {
            $group->get('', [PartidasController::class, 'getAll']);
            $group->get('/admin', [PartidasController::class, 'getAllAdmin'])->add(new AdministradorMiddleware());
            $group->get('/{id}', [PartidasController::class, 'getById']);
            
            // Rutas protegidas
            $group->post('', [PartidasController::class, 'create'])->add(new autenticadoMiddleware());
            $group->put('/{id}', [PartidasController::class, 'update'])->add(new DuenioPartidaOAdministradorMiddle());
            $group->post('/{id}/portada', [PartidasController::class, 'subirPortada'])->add(new DuenioPartidaOAdministradorMiddle());
            $group->put('/{id}/estado', [PartidasController::class, 'cambiarEstado'])->add(new DuenioPartidaOAdministradorMiddle());

            $group->delete('/{id}', [PartidasController::class, 'delete'])->add(new DuenioPartidaOAdministradorMiddle());
        });
        
        // Inscripciones
        $group->group('/inscripciones', function (RouteCollectorProxy $group) {
            $group->get('', [InscripcionesController::class, 'getAll'])->add(new autenticadoMiddleware());
            $group->get('/usuario/{id_usuario}', [InscripcionesController::class, 'getByUsuario'])->add(new DuenioOAdministradorMiddle());
            $group->get('/partida/{id_partida}', [InscripcionesController::class, 'getByPartida'])->add(new DuenioPartidaOAdministradorMiddle);
            $group->get('/partidaInscrito/{id_partida}', [InscripcionesController::class, 'checkautenticado'])->add(new autenticadoMiddleware);

            
            // Rutas protegidas
            $group->post('', [InscripcionesController::class, 'create'])->add(new autenticadoMiddleware());
            $group->delete('/partida/{id_partida}', [InscripcionesController::class, 'delete'])->add(new autenticadoMiddleware());
            $group->delete('/usuario/{id_usuario}/partida/{id_partida}', [InscripcionesController::class, 'deleteUser'])->add(new DuenioPartidaOAdministradorMiddle());
        });
        
        // Reportes
        $group->group('/reportes', function (RouteCollectorProxy $group) {
            $group->get('', [ReportesController::class, 'getAll'])->add(new AdministradorMiddleware());
            $group->get('/{id}', [ReportesController::class, 'getById'])->add(new DuenioOAdministradorMiddle());
            
            // Rutas protegidas
            $group->post('', [ReportesController::class, 'create']);
            $group->put('/{id}/estado', [ReportesController::class, 'updateStatus'])->add(new AdministradorMiddleware());
            $group->delete('/{id}', [ReportesController::class, 'delete'])->add(new AdministradorMiddleware());
        });
        
        // Sistemas de Juego
        $group->group('/sistemas', function (RouteCollectorProxy $group) {
            $group->get('', [SistemasJuegoController::class, 'getAll']);
            
            // Rutas protegidas
            $group->delete('/{id}', [SistemasJuegoController::class, 'delete'])->add(new DuenioPartidaOAdministradorMiddle());
            $group->post('', [SistemasJuegoController::class, 'create'])->add(new AdministradorMiddleware());
            $group->put('/{id}', [SistemasJuegoController::class, 'update'])->add(new AdministradorMiddleware());
        });
    });
    
    // Ruta de prueba
    $app->get('/', function ($request, $response) {
        $response->getBody()->write(json_encode([
            'message' => 'Bienvenido a la API de RollTogether',
            'endpoints' => [
                '/api/usuarios',
                '/api/categorias',
                '/api/partidas',
                '/api/inscripciones',
                '/api/reportes',
                '/api/sistemas'
            ]
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    });
};
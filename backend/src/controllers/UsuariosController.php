<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Database\Database;
use Firebase\JWT\JWT;
use PDO;
use Exception;

class UsuariosController
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function getAll(Request $request, Response $response): Response
    {
        $stmt = $this->db->query("SELECT * FROM usuarios");
        $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $response->getBody()->write(json_encode($usuarios));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function getById(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'];
        $stmt = $this->db->prepare("SELECT * FROM usuarios WHERE id = :id");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$usuario) {
            $response->getBody()->write(json_encode(['error' => 'Usuario no encontrado']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        $response->getBody()->write(json_encode($usuario));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function create(Request $request, Response $response): Response
    {
        $uploadedFile = $request->getUploadedFiles()['foto'] ?? null;
        $data = $request->getParsedBody();

        // Validación básica
        if (empty($data['nombre']) || empty($data['email']) || empty($data['password'])) {
            $response->getBody()->write(json_encode(['error' => 'Nombre, email y contraseña son requeridos']));
            return $response->withStatus(400)
                ->withHeader('Content-Type', 'application/json');
        }

        // Verificar si el email ya existe
        $email = $data['email'];
        $checkEmailSql = "SELECT id FROM usuarios WHERE email = :email";
        $checkStmt = $this->db->prepare($checkEmailSql);
        $checkStmt->bindParam(':email', $email);
        $checkStmt->execute();

        if ($checkStmt->rowCount() > 0) {
            $response->getBody()->write(json_encode(['error' => 'Ya hay un usuario asociado a ese correo']));
            return $response->withStatus(409) // 409 Conflict
                ->withHeader('Content-Type', 'application/json');
        }

        // Manejo de la imagen
        $fotoPerfil = 'default-user.png';
        if ($uploadedFile && $uploadedFile->getError() === UPLOAD_ERR_OK) {
            $extension = pathinfo($uploadedFile->getClientFilename(), PATHINFO_EXTENSION);
            $nombreArchivo = uniqid() . '.' . $extension;
            $directorioDestino = __DIR__ . '/../../../assets/usuarios';

            if (!is_dir($directorioDestino)) {
                mkdir($directorioDestino, 0777, true);
            }

            $uploadedFile->moveTo($directorioDestino . DIRECTORY_SEPARATOR . $nombreArchivo);
            $fotoPerfil = $nombreArchivo;
        }

        // Variables temporales para bindParam()
        $nombre = $data['nombre'];
        $password = password_hash($data['password'], PASSWORD_DEFAULT);
        $bio = $data['bio'] ?? '';
        $rol = $data['rol'] ?? 'usuario';
        $estado = $data['estado'] ?? 'activo';

        $sql = "INSERT INTO usuarios (nombre, email, password, foto_perfil, bio, rol, estado) 
        VALUES (:nombre, :email, :password, :foto_perfil, :bio, :rol, :estado)";

        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':nombre', $nombre);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':password', $password);
        $stmt->bindParam(':foto_perfil', $fotoPerfil);
        $stmt->bindParam(':bio', $bio);
        $stmt->bindParam(':rol', $rol);
        $stmt->bindParam(':estado', $estado);

        if ($stmt->execute()) {
            $response->getBody()->write(json_encode([
                'message' => 'Usuario creado exitosamente',
            ]));
            return $response->withStatus(201)
                ->withHeader('Content-Type', 'application/json');
        }

        $response->getBody()->write(json_encode(['error' => 'Error al crear usuario']));
        return $response->withStatus(500)
            ->withHeader('Content-Type', 'application/json');
    }
    public function cambiarEstado(Request $request, Response $response, array $args): Response
    {
        $idUsuario = $args['id'];
        try {
            $this->db->beginTransaction();
            $sql = "SELECT estado FROM usuarios WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':id', $idUsuario, PDO::PARAM_INT);
            $stmt->execute();
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$usuario) {
                $this->db->rollBack();
                $response->getBody()->write(json_encode(['error' => 'Usuario no encontrado']));
                return $response->withStatus(404)
                    ->withHeader('Content-Type', 'application/json');
            }
            $nuevoEstado = ($usuario['estado'] == 'activo') ? 'inactivo' : 'activo';
            $sql = "UPDATE usuarios SET estado = :estado WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':estado', $nuevoEstado);
            $stmt->bindParam(':id', $idUsuario, PDO::PARAM_INT);
            $stmt->execute();
            $sql = "UPDATE partidas SET estado = :estado WHERE id_creador = :id_creador";
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':estado', $nuevoEstado);
            $stmt->bindParam(':id_creador', $idUsuario, PDO::PARAM_INT);
            $stmt->execute();
            $partidasAfectadas = $stmt->rowCount();
            $this->db->commit();
            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Estado actualizado correctamente',
                'nuevo_estado' => $nuevoEstado,
                'partidas_afectadas' => $partidasAfectadas
            ]));
            return $response->withStatus(200)
                ->withHeader('Content-Type', 'application/json');
        } catch (\PDOException $e) {
            $response->getBody()->write(json_encode([
                'error' => 'Error al cambiar el estado',
                'details' => $e->getMessage()
            ]));
            return $response->withStatus(500)
                ->withHeader('Content-Type', 'application/json');
        }
    }
    public function update(Request $request, Response $response, array $args): Response
    {
        try {
            $id = (int) $args['id'];
            $data = (array) $request->getParsedBody();

            if (empty($data['nombre']) || empty($data['email'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Nombre y email son requeridos'
                ], JSON_UNESCAPED_UNICODE));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            $stmt = $this->db->prepare("SELECT * FROM usuarios WHERE id = ?");
            $stmt->execute([$id]);
            $usuarioActual = $stmt->fetch();

            if (!$usuarioActual) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Usuario no encontrado'
                ], JSON_UNESCAPED_UNICODE));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $sql = "UPDATE usuarios SET nombre = ?, email = ?, bio = ?";
            $params = [$data['nombre'], $data['email'], $data['bio'] ?? null];

            if (!empty($data['password'])) {
                $sql .= ", password = ?";
                $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
            }

            $sql .= " WHERE id = ?";
            $params[] = $id;

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Perfil actualizado'
            ], JSON_UNESCAPED_UNICODE));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }
    public function subirFoto(Request $request, Response $response, array $args): Response
    {
        try {
            $id = (int) $args['id'];

            $stmt = $this->db->prepare("SELECT * FROM usuarios WHERE id = ?");
            $stmt->execute([$id]);
            $usuario = $stmt->fetch();

            if (!$usuario) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Usuario no encontrado'
                ], JSON_UNESCAPED_UNICODE));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $uploadedFiles = $request->getUploadedFiles();
            if (empty($uploadedFiles['foto_perfil'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'No se envió ninguna imagen'
                ], JSON_UNESCAPED_UNICODE));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            $foto = $uploadedFiles['foto_perfil'];
            if ($foto->getError() !== UPLOAD_ERR_OK) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Error al subir la imagen'
                ], JSON_UNESCAPED_UNICODE));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            // Eliminar foto anterior si no es la predeterminada
            if ($usuario['foto_perfil'] && $usuario['foto_perfil'] !== 'default-user.png') {
                $rutaAnterior = __DIR__ . '/../../../assets/usuarios/' . $usuario['foto_perfil'];
                if (file_exists($rutaAnterior)) {
                    unlink($rutaAnterior);
                }
            }

            // Guardar nueva imagen
            $extension = pathinfo($foto->getClientFilename(), PATHINFO_EXTENSION);
            $nombreArchivo = uniqid() . '.' . $extension;
            $rutaDestino = __DIR__ . '/../../../assets/usuarios/' . $nombreArchivo;
            $foto->moveTo($rutaDestino);

            // Actualizar base de datos
            $stmt = $this->db->prepare("UPDATE usuarios SET foto_perfil = ? WHERE id = ?");
            $stmt->execute([$nombreArchivo, $id]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Imagen actualizada',
                'foto_perfil' => $nombreArchivo
            ], JSON_UNESCAPED_UNICODE));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }




    public function getPartidasByUsuario(Request $request, Response $response, array $args): Response
    {
        try {
            $id_usuario = (int)$args['id'];

            $sql = "SELECT 
                    p.id, 
                    p.titulo, 
                    p.descripcion, 
                    p.portada, 
                    p.tipo,
                    p.fecha, 
                    p.ubicacion, 
                    p.aforo_max, 
                    p.plazas_ocupadas,
                    p.estado AS estado_partida, 
                    p.fecha_creacion,
                    u.nombre AS nombre_usuario,
                    u.foto_perfil AS img
                FROM 
                    partidas p
                INNER JOIN 
                    usuarios u ON p.id_creador = u.id
                WHERE 
                    p.id_creador = :id_usuario
                ORDER BY 
                    p.fecha ASC";

            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':id_usuario', $id_usuario, PDO::PARAM_INT);
            $stmt->execute();

            $partidas = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($partidas)) {
                $payload = json_encode([
                    'success' => true,
                    'message' => 'El usuario no ha creado partidas',
                    'data' => []
                ], JSON_UNESCAPED_UNICODE);

                $response->getBody()->write($payload);
                return $response->withHeader('Content-Type', 'application/json');
            }

            $payload = json_encode([
                'success' => true,
                'count' => count($partidas),
                'data' => $partidas
            ], JSON_UNESCAPED_UNICODE);

            $response->getBody()->write($payload);
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\PDOException $e) {
            error_log('Error en getPartidasByUsuario: ' . $e->getMessage());

            $payload = json_encode([
                'success' => false,
                'error' => 'Error al obtener partidas del usuario',
                'details' => $e->getMessage()
            ], JSON_UNESCAPED_UNICODE);

            $response->getBody()->write($payload);
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }
    public function getFotoPerfil(Request $request, Response $response, array $args): Response
    {
        $nombreArchivo = $args['nombre'];
        $rutaImagen = '/../assets/usuarios/' . $nombreArchivo;

        if (!file_exists($rutaImagen)) {
            $response->getBody()->write(json_encode(['error' => 'Imagen no encontrada']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        $stream = fopen($rutaImagen, 'rb');
        $response = $response->withBody(new \Slim\Psr7\Stream($stream));

        $mimeType = mime_content_type($rutaImagen);

        return $response
            ->withHeader('Content-Type', $mimeType)
            ->withHeader('Content-Disposition', 'inline; filename="' . $nombreArchivo . '"')
            ->withStatus(200);
    }


    public function delete(Request $request, Response $response, array $args): Response
    {
        $id = $args['id'];

        $consulta = $this->db->prepare("SELECT rol FROM usuarios WHERE id = :id");
        $consulta->bindParam(':id', $id);
        $consulta->execute();
        $usuario = $consulta->fetch(PDO::FETCH_ASSOC);

        if (!$usuario) {
            $response->getBody()->write(json_encode(['error' => 'Usuario no encontrado']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        if ($usuario['rol'] === 'admin') {
            $response->getBody()->write(json_encode(['error' => 'No se puede eliminar un usuario administrador']));
            return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
        }

        $this->db->beginTransaction();

        try {
            $consulta = $this->db->prepare("SELECT id_partida FROM inscripciones WHERE id_usuario = :id_usuario");
            $consulta->bindParam(':id_usuario', $id);
            $consulta->execute();
            $partidas = $consulta->fetchAll(PDO::FETCH_COLUMN);

            if (!empty($partidas)) {
                $marcadores = implode(',', array_fill(0, count($partidas), '?'));
                $consulta = $this->db->prepare("
                UPDATE partidas 
                SET plazas_ocupadas = plazas_ocupadas - 1 
                WHERE id IN ($marcadores) 
                AND plazas_ocupadas > 0
            ");
                $consulta->execute($partidas);
            }

            $consulta = $this->db->prepare("DELETE FROM inscripciones WHERE id_usuario = :id_usuario");
            $consulta->bindParam(':id_usuario', $id);
            $consulta->execute();

            $consulta = $this->db->prepare("DELETE FROM usuarios WHERE id = :id");
            $consulta->bindParam(':id', $id);
            $consulta->execute();

            $this->db->commit();

            $response->getBody()->write(json_encode(['message' => 'Usuario eliminado exitosamente']));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $this->db->rollBack();
            $response->getBody()->write(json_encode([
                'error' => 'Error al eliminar usuario',
                'detalles' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
    public function login(Request $request, Response $response): Response
    {
        $params = (array) $request->getParsedBody();
        $email = $params['email'] ?? '';
        $password = $params['password'] ?? '';

        $stmt = $this->db->prepare("SELECT * FROM usuarios WHERE email = :email");
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($password, $user['password'])) {
            if ($user['estado'] == 'inactivo') {
                $response->getBody()->write(json_encode(["error" => "este usuario esta inhabilitado"]));
                return $response->withStatus(401);
            }
            $payload = [
                "sub" => $user['id'],
                "foto_perfil" => $user['foto_perfil'],
                "nombre" => $user['nombre'],
                "rol" => $user['rol'],
                "iat" => time(),
                "exp" => time() + (60 * 60 * 24)
            ];

            $token = JWT::encode($payload, $_ENV['SECRET_KEY'], "HS256");
            $response->getBody()->write(json_encode(["token" => $token]));
            return $response->withHeader('Content-Type', 'application/json');
        }

        $response->getBody()->write(json_encode(["error" => "Credenciales inválidas"]));
        return $response->withStatus(401);
    }
    public function refrescarToken(Request $request, Response $response): Response
    {
        $authHeader = $request->getHeaderLine('Authorization');
        if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $data = ["error" => "Token no proporcionado"];
            $response->getBody()->write(json_encode($data));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(401);
        }

        $token = $matches[1];

        try {
            $decoded = JWT::decode($token, new \Firebase\JWT\Key($_ENV['SECRET_KEY'], 'HS256'));
            $id = $decoded->sub;

            $stmt = $this->db->prepare("SELECT id, nombre, foto_perfil, rol FROM usuarios WHERE id = :id");
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$usuario) {
                $data = ["error" => "Usuario no encontrado"];
                $response->getBody()->write(json_encode($data));
                return $response
                    ->withHeader('Content-Type', 'application/json')
                    ->withStatus(404);
            }

            $payload = [
                "sub" => $usuario['id'],
                "foto_perfil" => $usuario['foto_perfil'],
                "nombre" => $usuario['nombre'],
                "rol" => $usuario['rol'],
                "iat" => time(),
                "exp" => time() + (60 * 60 * 24) // 24 horas
            ];

            $newToken = JWT::encode($payload, $_ENV['SECRET_KEY'], "HS256");

            $data = ["token" => $newToken];
            $response->getBody()->write(json_encode($data));
            return $response
                ->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $data = ["error" => "Token inválido: " . $e->getMessage()];
            $response->getBody()->write(json_encode($data));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(401);
        }
    }
    public function recuperarContrasenia(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $correo = filter_var($data['correo'] ?? '', FILTER_VALIDATE_EMAIL);

        if (!$correo) {
            $response->getBody()->write(json_encode([
                'error' => 'Correo electrónico no válido'
            ]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        try {
            $stmt = $this->db->prepare("SELECT id, nombre FROM usuarios WHERE email = ? LIMIT 1");
            $stmt->execute([$correo]);
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$usuario) {
                // Por seguridad, no revelamos si el correo existe o no
                $response->getBody()->write(json_encode([
                    'mensaje' => 'el correo no exite'
                ]));
                return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
            }

            // Generar nueva contraseña aleatoria
            $nuevaContraseña = bin2hex(random_bytes(6));
            $hash = password_hash($nuevaContraseña, PASSWORD_DEFAULT);

            $stmt = $this->db->prepare("UPDATE usuarios SET password = ? WHERE id = ?");
            $stmt->execute([$hash, $usuario['id']]);

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
                            'Email' => "soporte@rolltogether.es",
                            'Name' => "Soporte RollTogether"
                        ],
                        'To' => [
                            [
                                'Email' => $correo,
                                'Name' => $usuario['nombre'] ?? "Usuario"
                            ]
                        ],
                        'Subject' => "Tu nueva contraseña en RollTogether",
                        'HTMLPart' => "<h3>Recuperación de contraseña</h3>
                                   <p>Hemos generado una nueva contraseña para tu cuenta:</p>
                                   <p><strong>$nuevaContraseña</strong></p>
                                   <p>Por favor, inicia sesión y cambia esta contraseña temporal lo antes posible.</p>
                                   <p>Si no solicitaste este cambio, por favor contacta con nuestro soporte.</p>",
                        'TextPart' => "Tu nueva contraseña temporal es: $nuevaContraseña\n\n" .
                            "Por favor, cámbiala después de iniciar sesión."
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
                throw new Exception('Error al enviar el correo de recuperación');
            }
        } catch (\PDOException $e) {
            error_log("Error de base de datos: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'error' => 'Error interno del servidor'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            error_log("Error general: " . $e->getMessage());
            $response->getBody()->write(json_encode([
                'error' => 'Error al procesar la solicitud'
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }
}

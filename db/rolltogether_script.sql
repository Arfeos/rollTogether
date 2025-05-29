-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1:3306
-- Tiempo de generación: 29-05-2025 a las 20:20:43
-- Versión del servidor: 10.11.10-MariaDB-log
-- Versión de PHP: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `u223272719_rolltogether`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`id`, `nombre`) VALUES
(2, 'Ciencia Ficción'),
(3, 'Horror'),
(4, 'Aventura Pulp'),
(5, 'Superhéroes'),
(6, 'Misterio'),
(7, 'Steampunk'),
(8, 'Cyberpunk'),
(11, 'Fantasía Medieval');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inscripciones`
--

CREATE TABLE `inscripciones` (
  `id_usuario` int(11) NOT NULL,
  `id_partida` int(11) NOT NULL,
  `fecha_inscripcion` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `inscripciones`
--

INSERT INTO `inscripciones` (`id_usuario`, `id_partida`, `fecha_inscripcion`) VALUES
(2, 3, '2025-04-22 18:35:00'),
(2, 8, '2025-05-12 10:05:00'),
(3, 2, '2025-04-17 11:35:00'),
(3, 8, '2025-05-13 13:15:00'),
(4, 2, '2025-04-18 13:50:00'),
(6, 3, '2025-05-28 19:07:29'),
(6, 14, '2025-05-28 19:07:40'),
(6, 15, '2025-05-28 19:07:52'),
(6, 16, '2025-05-28 19:07:20'),
(6, 17, '2025-05-28 19:08:06'),
(17, 2, '2025-05-28 18:07:05'),
(17, 15, '2025-05-28 18:05:54'),
(18, 14, '2025-05-28 17:47:41'),
(19, 14, '2025-05-28 18:05:18');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `partidas`
--

CREATE TABLE `partidas` (
  `id` int(11) NOT NULL,
  `titulo` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `portada` varchar(255) DEFAULT NULL,
  `aforo_max` int(11) NOT NULL,
  `plazas_ocupadas` int(11) DEFAULT 0,
  `fecha` datetime NOT NULL,
  `ubicacion` varchar(100) NOT NULL,
  `id_creador` int(11) NOT NULL,
  `id_categoria` int(11) NOT NULL,
  `id_sistema` int(11) NOT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `estado` enum('activo','inactivo','oculta') NOT NULL DEFAULT 'activo',
  `tipo` enum('presencial','digital') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `partidas`
--

INSERT INTO `partidas` (`id`, `titulo`, `descripcion`, `portada`, `aforo_max`, `plazas_ocupadas`, `fecha`, `ubicacion`, `id_creador`, `id_categoria`, `id_sistema`, `fecha_creacion`, `estado`, `tipo`) VALUES
(2, 'Star Wars: Edge of the Empires', 'Aventuras en los confines del Imperio Galáctico', 'starwars.jpg', 6, 3, '2025-05-22 17:30:00', 'Librería Mundos Imaginarios, Barcelona', 2, 2, 5, '2025-04-15 10:30:00', 'activo', 'presencial'),
(3, 'Cthulhu: La Máscara de Nyarlathotep', 'Investigación global de los horrores de los Mitos', 'cthulhu.jpg', 4, 2, '2025-06-05 19:00:00', 'Casa de juegos La Guarida, Valencia', 4, 3, 3, '2025-04-20 16:45:00', 'activo', 'presencial'),
(8, 'Call of Cthulhu: Horror Nocturno', 'Sesión de terror en vivo por videollamada', 'horror_nocturno.jpg', 4, 2, '2025-06-22 22:00:00', 'Zoom + Tabletop Simulator', 4, 3, 3, '2025-05-10 18:45:00', 'activo', 'digital'),
(14, 'Gatos explosivos', 'Los gatos de la partida explotan contra los malos.', '68374c7fdc714.png', 6, 3, '2025-06-04 10:10:00', 'Mi casita, Cuenca', 17, 5, 7, '2025-05-28 17:01:11', 'activo', 'presencial'),
(15, 'Natlan', 'Un juego basado en un mundo totalmente peligroso y de aventura. Tendremos que superar la misión llamada \"Las tres pruebas\" para poder descubrir el misterio que alberga este mundo.', '68374f8ecb873.jpeg', 5, 2, '2025-06-05 17:00:00', 'Discord', 19, 4, 7, '2025-05-28 18:01:50', 'activo', 'digital'),
(16, 'Star Wars: La Caída del Velo', 'Tras la destrucción de la segunda estrella de la muerte la paz parece haber vuelto a la galaxia. Sin embargo, ese frágil velo ha caído, dejando entrever conflictos en la galaxia que solo la Orden Jedi y sus aliados pueden solucionar.', '68381a315fe87.png', 5, 1, '2025-06-19 14:30:00', 'Roll20', 20, 2, 1, '2025-05-28 18:08:16', 'activo', 'digital'),
(17, 'Stelar runes', 'Una aventura en busca de misterios galácticos', '683755e044a7f.jpg', 5, 1, '1970-01-01 12:24:00', 'Discord', 18, 4, 7, '2025-05-28 18:28:48', 'activo', 'digital'),
(18, 'Breath of the Wild', 'El jugador explora un vasto mundo abierto, resuelve acertijos y se enfrenta a diversos enemigos para salvar a la Princesa Zelda y restaurar la paz en el reino. \r\n', '6837871c23b9c.jpeg', 4, 0, '2025-06-30 14:20:00', 'Discord', 17, 2, 8, '2025-05-28 21:58:52', 'activo', 'digital'),
(21, 'fdafsdfasfadsfS', 'SADSASDASDASDASD', '68385560365f1.jpg', 5, 0, '2025-06-18 08:23:00', 'ASDASDASDA', 24, 4, 5, '2025-05-29 12:38:56', 'activo', 'presencial');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reportes`
--

CREATE TABLE `reportes` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `asunto` varchar(255) NOT NULL,
  `descripcion` text NOT NULL,
  `fecha_reporte` datetime DEFAULT current_timestamp(),
  `estado` enum('pendiente','resuelto') DEFAULT 'pendiente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `reportes`
--

INSERT INTO `reportes` (`id`, `nombre`, `email`, `asunto`, `descripcion`, `fecha_reporte`, `estado`) VALUES
(1, 'Luis Fernández', 'luis@email.com', 'Problema con usuario', 'Un usuario ha sido grosero en los mensajes de una partida', '2025-04-15 14:30:00', 'pendiente'),
(2, 'Sofía Martínez', 'sofia@email.com', 'Partida cancelada sin aviso', 'El director de juego canceló la partida sin previo aviso', '2025-04-18 16:45:00', 'resuelto'),
(3, 'Pedro Gómez', 'pedro@email.com', 'Contenido inapropiado', 'Una partida contiene descripciones ofensivas', '2025-04-20 10:15:00', 'pendiente'),
(4, 'Susana Camila', 'susanitacamila@gmail.com', 'la pagina es fea', 'pro fafvor ,arregla eso', '2025-05-25 22:03:08', 'pendiente'),
(5, 'Inés', 'ineeshitamartinez@gmail.com', 'la pagina es fea', 'Escribe bien, por favor', '2025-05-25 22:08:12', 'pendiente'),
(6, 'adsadasdasd', 'angelmartinezcastellanos1@gmail.com', 'error en el logo', 'dasdasdasdadsadsad', '2025-05-28 11:14:43', 'pendiente');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sistemas_juego`
--

CREATE TABLE `sistemas_juego` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `anio_lanzamiento` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `sistemas_juego`
--

INSERT INTO `sistemas_juego` (`id`, `nombre`, `descripcion`, `anio_lanzamiento`) VALUES
(1, 'Dungeons & Dragons 5e', 'El sistema de rol más popular del mundo', 2014),
(2, 'Pathfinder', 'Basado en D&D 3.5 con mejoras', 2009),
(3, 'Call of Cthulhu', 'Juego de horror basado en los Mitos de Cthulhu', 1981),
(4, 'Vampiro: La Mascarada', 'Juego de rol de vampiros en el Mundo de Tinieblas', 1991),
(5, 'Star Wars RPG', 'Sistema oficial de rol del universo Star Wars', 2012),
(6, 'Cyberpunk RED', 'Rol de acción futurista en el mundo de Cyberpunk', 2020),
(7, 'FATE', 'Sistema genérico narrativo', 2003),
(8, 'Savage Worlds', 'Sistema genérico rápido y flexible', 2003);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `foto_perfil` varchar(255) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `rol` enum('usuario','admin') DEFAULT 'usuario',
  `fecha_registro` datetime DEFAULT current_timestamp(),
  `estado` enum('activo','inactivo') NOT NULL DEFAULT 'activo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `foto_perfil`, `bio`, `rol`, `fecha_registro`, `estado`) VALUES
(2, 'Carlos Méndez', 'carlos@email.com', '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm', 'carlos.jpg', 'Fanático de los juegos indie y sistemas alternativos', 'usuario', '2024-02-20 14:45:00', 'activo'),
(3, 'María López', 'maria@email.com', '$2y$10$IOnZq3JvFHfBz6eB5u0Y.eq5h5p5w6d7V8c9A0B1C2D3E4F5G6H7I', 'maria.jpg', 'Nueva en el mundo del rol pero con muchas ganas de aprender', 'usuario', '2024-03-05 09:15:00', 'activo'),
(4, 'Javier Ruiz', 'javier@email.com', '$2y$10$N9qo8u7Af6jBdC1E2F3G4H5I6J7K8L9M0N1O2P3Q4R5S6T7U8V9W', 'javier.jpg', 'Especialista en partidas de horror y misterio', 'usuario', '2024-03-18 16:20:00', 'activo'),
(6, 'Arfeos', 'angelmartinezcastellanos1@gmail.com', '$2y$10$pnVWZcpD2MzP3C484RAQtO3tNtR7jYpNMaZih2WnQKJaFTOPU1Ji.', '683733354728a.jpg', 'Hola me llamo Angel\n', 'admin', '2025-05-16 08:09:18', 'activo'),
(17, 'Hatofiriax', 'ilizcanoor@gmail.com', '$2y$10$0gXRve67pYJ83dFShW4M3.abkM.4kayKAVl2URUO3lYbO5FvmX1WO', '6837407b6272d.png', '', 'usuario', '2025-05-28 16:56:28', 'activo'),
(18, 'Mikat0ri', 'susanacamila503@gmail.com', '$2y$10$7T6qq3.0WgnxeLoIuFxHf.Je4ppEsbG97K7w1qgESLbymSphSNms6', '6837548a3431c.jpg', 'Amo la fantasía ', 'usuario', '2025-05-28 17:45:33', 'activo'),
(19, 'Bianca', 'maria.bianca.clej@gmail.com', '$2y$10$mFUvLREMykNMsbAd03yBcete8pL68npNDjgPWKM8AlYuGpwXz1xfC', 'default-user.png', '', 'usuario', '2025-05-28 17:50:41', 'activo'),
(20, 'Javier ', 'javidipi98@gmail.com', '$2y$10$XW5Klsbirs5W6U3nouLog.stqiMM78vULz.sgeSwtBQUVxcauXm.G', 'default-user.png', '', 'usuario', '2025-05-28 17:54:12', 'activo'),
(21, 'Reyplayer98', 'reyplayer98@gmail.com', '$2y$10$wvA9EIUnMsVUdSQ9JaqRbuu4Q8yxCqM/.85RL/i.IdJwhh/Gmpr1e', '68375066de75e.jpg', '', 'usuario', '2025-05-28 18:03:42', 'activo'),
(24, 'pepe', 'pepe@gmail.com', '$2y$10$.oOXiaX4ahpRdHeGlTdJAupfGhtLuCOMj3Me.6KRmgwuheOIIacJG', 'default-user.png', '', 'usuario', '2025-05-28 21:51:35', 'activo'),
(25, 'soporte', 'soporte@rolltogether.es', '$2y$10$PeNgr0HJuSJlTmLKA189EOJMyNhJH/QtLX3663NcjPAEYhIrwb3ea', '68381654b05d7.png', '', 'admin', '2025-05-29 07:49:19', 'activo');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `inscripciones`
--
ALTER TABLE `inscripciones`
  ADD UNIQUE KEY `id_usuario` (`id_usuario`,`id_partida`),
  ADD KEY `id_partida` (`id_partida`);

--
-- Indices de la tabla `partidas`
--
ALTER TABLE `partidas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_creador` (`id_creador`),
  ADD KEY `id_categoria` (`id_categoria`),
  ADD KEY `id_sistema` (`id_sistema`);

--
-- Indices de la tabla `reportes`
--
ALTER TABLE `reportes`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `sistemas_juego`
--
ALTER TABLE `sistemas_juego`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `partidas`
--
ALTER TABLE `partidas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT de la tabla `reportes`
--
ALTER TABLE `reportes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `sistemas_juego`
--
ALTER TABLE `sistemas_juego`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `inscripciones`
--
ALTER TABLE `inscripciones`
  ADD CONSTRAINT `inscripciones_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inscripciones_ibfk_2` FOREIGN KEY (`id_partida`) REFERENCES `partidas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `partidas`
--
ALTER TABLE `partidas`
  ADD CONSTRAINT `partidas_ibfk_1` FOREIGN KEY (`id_creador`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `partidas_ibfk_2` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `partidas_ibfk_3` FOREIGN KEY (`id_sistema`) REFERENCES `sistemas_juego` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

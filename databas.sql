-- --------------------------------------------------------
-- Värd:                         127.0.0.1
-- Serverversion:                5.7.27-0ubuntu0.18.04.1 - (Ubuntu)
-- Server-OS:                    Linux
-- HeidiSQL Version:             10.2.0.5599
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;


-- Dumpar databasstruktur för time
CREATE DATABASE IF NOT EXISTS `time` /*!40100 DEFAULT CHARACTER SET latin1 */;
USE `time`;

-- Dumpar struktur för tabell time.checks
CREATE TABLE IF NOT EXISTS `checks` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID of the check',
  `user` int(11) DEFAULT NULL COMMENT 'ID of the user',
  `check_in` tinyint(4) DEFAULT NULL COMMENT 'Boolean(0-1) if the it was a check in (otherwise check out)',
  `project` text COMMENT 'Name of the project',
  `date` bigint(20) DEFAULT NULL COMMENT 'Date of the project',
  `type` text COMMENT 'Check in type (web, card, TOP SECRET)',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumpar data för tabell time.checks: ~0 rows (ungefär)
/*!40000 ALTER TABLE `checks` DISABLE KEYS */;
/*!40000 ALTER TABLE `checks` ENABLE KEYS */;

-- Dumpar struktur för tabell time.Joints
CREATE TABLE IF NOT EXISTS `Joints` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID of the joint',
  `project` text COMMENT 'Name of the project',
  `user` int(11) DEFAULT NULL COMMENT 'ID of the user',
  `work` bigint(20) DEFAULT NULL COMMENT 'Work done in ms (1 hour of work = 3600000)',
  `date` bigint(20) DEFAULT NULL COMMENT 'Date of joining the project',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumpar data för tabell time.Joints: ~0 rows (ungefär)
/*!40000 ALTER TABLE `Joints` DISABLE KEYS */;
/*!40000 ALTER TABLE `Joints` ENABLE KEYS */;

-- Dumpar struktur för tabell time.projects
CREATE TABLE IF NOT EXISTS `projects` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID  of the project',
  `name` text COMMENT 'Name of the project',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumpar data för tabell time.projects: ~0 rows (ungefär)
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;

-- Dumpar struktur för tabell time.tokens
CREATE TABLE IF NOT EXISTS `tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID of the token',
  `user` int(11) DEFAULT NULL COMMENT 'ID of the user',
  `token` text COMMENT 'Token',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumpar data för tabell time.tokens: ~0 rows (ungefär)
/*!40000 ALTER TABLE `tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `tokens` ENABLE KEYS */;

-- Dumpar struktur för tabell time.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID of the user',
  `username` text COMMENT 'User chosen name',
  `name` text COMMENT 'Full name of the user ',
  `avatar` text COMMENT 'Link of the username',
  `email` text COMMENT 'Email of the user',
  `access_token` text COMMENT 'Access token given by slack, used to update user information',
  `admin` tinyint(4) DEFAULT NULL COMMENT 'Boolean(0-1) if the user is an admin or not.',
  `created` bigint(20) DEFAULT NULL COMMENT 'The date the user was created',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumpar data för tabell time.users: ~0 rows (ungefär)
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;

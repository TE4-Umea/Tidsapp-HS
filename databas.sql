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

-- Dumpar struktur för tabell time.joints
CREATE TABLE IF NOT EXISTS `joints` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID of the joint',
  `project` text COMMENT 'Name of the project',
  `user` int(11) DEFAULT NULL COMMENT 'ID of the user',
  `work` bigint(20) DEFAULT NULL COMMENT 'Work done in ms (1 hour of work = 3600000)',
  `date` bigint(20) DEFAULT NULL COMMENT 'Date of joining the project',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumpar data för tabell time.joints: ~0 rows (ungefär)
/*!40000 ALTER TABLE `joints` DISABLE KEYS */;
/*!40000 ALTER TABLE `joints` ENABLE KEYS */;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;

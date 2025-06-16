<?php
$host = 'localhost';
$user = 'root'; // ili tvoj MySQL korisnik
$pass = '';     // lozinka ako postoji
$dbname = 'fotostudio';

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    die("Konekcija neuspešna: " . $conn->connect_error);
}
else
{
    Console.log("Uspešna konekcija (baza slider)");
}
?>
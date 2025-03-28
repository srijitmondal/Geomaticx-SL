<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

$host = "localhost";
$dbname = "geoma7i3_geomaticx_et_dms";
$username = "root";
$password = "";

try {
    // Connect to the database
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Query to count all user IDs
    $stmt = $pdo->prepare("
        SELECT COUNT(ud.u_id) AS user_count
        FROM user_details ud
        WHERE ud.u_is_del = 0;
    ");

    $stmt->execute();

    // Fetch the count
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    // Return JSON response with just the count
    echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
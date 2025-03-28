<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

$host = "localhost";  // Change this to your database host
$dbname = "geoma7i3_geomaticx_et_dms";  // Change this to your database name
$username = "root";  // Change this to your database username
$password = "";  // Change this to your database password

try {
    // Connect to the database
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Query to fetch all users and their roles
    $stmt = $pdo->prepare("
        SELECT 
    ur.role_id, 
    ur.role_name, 
    COUNT(ar.u_id) AS user_count
FROM user_role ur
LEFT JOIN assigned_role ar ON ur.role_id = ar.role_id AND ar.ass_role_del = 0  
GROUP BY ur.role_id, ur.role_name;
    ");
    $stmt->execute();

    // Fetch all results
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Return JSON response
    echo json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);


} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>

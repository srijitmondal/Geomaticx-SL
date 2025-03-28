<?php
header("Access-Control-Allow-Origin: http://localhost:8081");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get JSON input
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!isset($data['userId'])) {
    echo json_encode(['error' => 'User ID not provided']);
    exit();
}

// Database connection settings
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "geoma7i3_geomaticx_et_dms";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die(json_encode(['error' => "Connection failed: " . $conn->connect_error]));
}

// SQL query to fetch user details
$sql = "SELECT 
            u_id,
            user_id,
            u_fname,
            u_mname,
            u_lname,
            u_gender,
            u_email,
            u_mob,
            u_city,
            u_state,
            u_country,
            u_zip_code,
            u_street_addr,
            u_organization,
            u_pro_img,
            u_created_at,
            u_updated_at,
            u_active
        FROM user_details 
        WHERE u_id = ? AND u_is_del = 0";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $data['userId']);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    // Remove sensitive information
    unset($row['u_pass']);
    unset($row['u_cv']);
    echo json_encode([
        'status' => 'success',
        'data' => $row
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'User not found'
    ]);
}

$conn->close();
<?php
// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

// Handle preflight request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database connection
$host = "localhost";
$username = "root";
$password = "";
$database = "geoma7i3_geomaticx_et_dms";

$conn = new mysqli($host, $username, $password, $database);

if ($conn->connect_error) {
    die(json_encode([
        "success" => false,
        "error" => "Database connection failed: " . $conn->connect_error
    ]));
}

// Handle Employee Login Attendance
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['user_id']) || !isset($data['login_lat_long'])) {
        echo json_encode([
            "success" => false,
            "error" => "Missing required fields (user_id and login_lat_long are required)"
        ]);
        exit;
    }

    $user_id = intval($data['user_id']);
    $login_lat_long = $data['login_lat_long'];
    $today = date('Y-m-d');

    // Check if user already logged in today
    $checkSql = "SELECT attn_id FROM attendance_details 
                WHERE user_id = ? 
                AND DATE(login_timestamp) = ? 
                AND is_logged_out = 0";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("is", $user_id, $today);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows > 0) {
        echo json_encode([
            "success" => false,
            "error" => "User already has an active login session today"
        ]);
        $checkStmt->close();
        exit;
    }
    $checkStmt->close();

    // Insert new login record
    $insertSql = "INSERT INTO attendance_details 
                 (user_id, login_timestamp, login_lat_long, is_logged_out) 
                 VALUES (?, NOW(), ?, 0)";
    $insertStmt = $conn->prepare($insertSql);
    $insertStmt->bind_param("is", $user_id, $login_lat_long);
    
    if ($insertStmt->execute()) {
        echo json_encode([
            "success" => true,
            "attn_id" => $insertStmt->insert_id,
            "user_id" => $user_id,
            "login_lat_long" => $login_lat_long,
            "login_date" => $today,
            "message" => "Login recorded successfully"
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "error" => "Failed to insert attendance record"
        ]);
    }
    $insertStmt->close();
}

$conn->close();
?>
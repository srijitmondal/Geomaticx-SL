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

// Handle Attendance Check
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['user_id'])) {
        echo json_encode([
            "success" => false,
            "error" => "Missing required field: user_id"
        ]);
        exit;
    }

    $user_id = intval($data['user_id']);
    $today = date('Y-m-d');

    // Query to check today's attendance
    $sql = "SELECT 
                attn_id, 
                login_timestamp, 
                login_lat_long, 
                is_logged_out,
                logout_timestamp,
                logout_lat_long
            FROM attendance_details 
            WHERE user_id = ? 
            AND DATE(login_timestamp) = ?
            ORDER BY login_timestamp DESC
            LIMIT 1";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("is", $user_id, $today);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode([
            "success" => true,
            "has_login" => false,
            "message" => "No login record found for today"
        ]);
    } else {
        $row = $result->fetch_assoc();
        $response = [
            "success" => true,
            "has_login" => true,
            "attendance" => [
                "attn_id" => $row['attn_id'],
                "login_timestamp" => $row['login_timestamp'],
                "login_lat_long" => $row['login_lat_long'],
                "is_logged_out" => (bool)$row['is_logged_out']
            ]
        ];
        
        // Add logout details if available
        if ($row['is_logged_out'] == 1) {
            $response['attendance']['logout_timestamp'] = $row['logout_timestamp'];
            $response['attendance']['logout_lat_long'] = $row['logout_lat_long'];
        }
        
        echo json_encode($response);
    }
    
    $stmt->close();
}

$conn->close();
?>
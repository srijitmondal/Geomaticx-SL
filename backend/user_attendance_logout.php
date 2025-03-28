<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database connection
$host = "localhost";
$username = "root";
$password = "";
$database = "geoma7i3_geomaticx_et_dms";

try {
    $conn = new mysqli($host, $username, $password, $database);
    
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON input");
        }

        if (!isset($data['user_id']) || !isset($data['logout_lat_long'])) {
            throw new Exception("Missing required fields");
        }

        $user_id = intval($data['user_id']);
        $logout_lat_long = $data['logout_lat_long'];
        $today = date('Y-m-d');

        // Find today's login record that hasn't been logged out
        $findSql = "SELECT attn_id FROM attendance_details 
                    WHERE user_id = ? 
                    AND is_logged_out = 0 
                    AND DATE(login_timestamp) = ?
                    ORDER BY login_timestamp DESC 
                    LIMIT 1";
        
        $stmt = $conn->prepare($findSql);
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        
        $stmt->bind_param("is", $user_id, $today);
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }
        
        $result = $stmt->get_result();
        if ($result->num_rows === 0) {
            throw new Exception("No active login session found for today");
        }
        
        $row = $result->fetch_assoc();
        $attn_id = $row['attn_id'];
        $stmt->close();

        // Update record with logout information
        $updateSql = "UPDATE attendance_details 
                      SET logout_timestamp = NOW(), 
                          logout_lat_long = ?,
                          is_logged_out = 1
                      WHERE attn_id = ?";
        
        $stmt = $conn->prepare($updateSql);
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        
        $stmt->bind_param("si", $logout_lat_long, $attn_id);
        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }
        
        echo json_encode([
            "success" => true,
            "message" => "Logout recorded successfully",
            "attn_id" => $attn_id
        ]);
        $stmt->close();
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
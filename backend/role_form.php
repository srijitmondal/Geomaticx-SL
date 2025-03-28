<?php
// Allow access from any frontend (for development use "*", in production use the actual frontend URL)
header("Access-Control-Allow-Origin: *");

// Allow required methods and headers
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight (OPTIONS) request immediately
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json");

// Database credentials (change to your actual values)
$servername = "localhost";  
$username = "root";  
$password = "";  
$database = "geoma7i3_geomaticx_et_dms";  

// Create connection
$conn = new mysqli($servername, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]));
}

// Read JSON input
$data = json_decode(file_get_contents("php://input"), true);

// Validate input data
if (!isset($data["role_id"], $data["role_name"], $data["role_parent"])) {
    echo json_encode(["success" => false, "message" => "Invalid input data"]);
    exit();
}

// Sanitize & Assign variables
$role_id = intval($data["role_id"]); // Ensure it's a number
$role_name = trim($data["role_name"]);
$role_parent = intval($data["role_parent"]); // Ensure role_parent is stored as role_id, not role_name
$created_at = isset($data["created_at"]) ? $data["created_at"] : date("Y-m-d H:i:s");
$updated_at = date("Y-m-d H:i:s");
$role_active = isset($data["role_active"]) ? intval($data["role_active"]) : 1;
$role_is_del = isset($data["role_is_del"]) ? intval($data["role_is_del"]) : 0;

// Check if role_id exists
$checkQuery = "SELECT role_id FROM user_role WHERE role_id = ?";
$stmtCheck = $conn->prepare($checkQuery);
$stmtCheck->bind_param("i", $role_id);
$stmtCheck->execute();
$result = $stmtCheck->get_result();

if ($result->num_rows > 0) {
    // Role exists, update it
    $updateQuery = "UPDATE user_role SET 
        role_name = ?, 
        role_parent = ?, 
        updated_at = ?, 
        role_active = ?, 
        role_is_del = ? 
        WHERE role_id = ?";
    $stmt = $conn->prepare($updateQuery);
    $stmt->bind_param("sisiii", $role_name, $role_parent, $updated_at, $role_active, $role_is_del, $role_id);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Role updated successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Error updating role: " . $stmt->error]);
    }
    $stmt->close();
} else {
    // Insert new role
    $insertQuery = "INSERT INTO user_role (role_id, role_name, role_parent, created_at, updated_at, role_active, role_is_del) 
        VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($insertQuery);
    $stmt->bind_param("issssii", $role_id, $role_name, $role_parent, $created_at, $updated_at, $role_active, $role_is_del);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "New role added successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Error inserting role: " . $stmt->error]);
    }
    $stmt->close();
}

// Close DB connection
$conn->close();
?>

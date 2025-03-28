<?php
// Allow access from any frontend (Use "*" for development, restrict in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight (OPTIONS) request immediately
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Initialize $conn outside try-catch to ensure it's in scope
$conn = null;

try {
    // Database credentials
    $servername = "localhost";  
    $username = "root";  
    $password = "";  
    $database = "dummy";  

    // Create connection
    $conn = new mysqli($servername, $username, $password, $database);

    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }

    // Read JSON input
    $json = file_get_contents('php://input');
    if (empty($json)) {
        throw new Exception("No input data received");
    }
    
    $data = json_decode($json, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Invalid JSON data: " . json_last_error_msg());
    }

    // Validate required fields
    $required = ["user_id", "first_name", "last_name", "email", "mobile"];
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty(trim($data[$field]))) {
            throw new Exception("Missing or empty required field: $field");
        }
    }

    // Sanitize & Assign variables
    $user_id = trim($data["user_id"]);
    $first_name = trim($data["first_name"]);
    $middle_name = trim($data["middle_name"] ?? '');
    $last_name = trim($data["last_name"]);
    $gender = trim($data["gender"] ?? '');
    $email = trim($data["email"]);
    $role = trim($data["role_name"] ?? '');
    $mobile = trim($data["mobile"]);
    $city = trim($data["city"] ?? '');
    $state = trim($data["state"] ?? '');
    $country = trim($data["country"] ?? '');
    $zip_code = trim($data["zip_code"] ?? '');
    $street_address = trim($data["street_address"] ?? '');
    $organization = trim($data["organization"] ?? '');
    $password = !empty($data["password"] ?? '') ? password_hash(trim($data["password"]), PASSWORD_BCRYPT) : '';
    $profile_image = trim($data["profile_image"] ?? '');
    $cv = trim($data["cv"] ?? '');
    $created_at = isset($data["created_at"]) ? $data["created_at"] : date("Y-m-d H:i:s");
    $updated_at = date("Y-m-d H:i:s");
    $active = isset($data["active"]) ? intval($data["active"]) : 1;
    $is_deleted = isset($data["is_deleted"]) ? intval($data["is_deleted"]) : 0;

    // Check if user exists
    $checkQuery = "SELECT u_id FROM user_details WHERE user_id = ?";
    $stmtCheck = $conn->prepare($checkQuery);
    if (!$stmtCheck) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $stmtCheck->bind_param("s", $user_id);
    if (!$stmtCheck->execute()) {
        throw new Exception("Execute failed: " . $stmtCheck->error);
    }
    
    $result = $stmtCheck->get_result();
    $stmtCheck->close();

    if ($result->num_rows > 0) {
        // User exists - UPDATE
        $row = $result->fetch_assoc();
        $u_id = $row['u_id'];
        
        $updateFields = [
            "user_id = ?",
            "u_fname = ?",
            "u_mname = ?",
            "u_lname = ?",
            "u_gender = ?",
            "u_email = ?",
            "u_mob = ?",
            "u_city = ?",
            "u_state = ?",
            "u_country = ?",
            "u_zip_code = ?",
            "u_street_addr = ?",
            "u_organization = ?",
            "u_pro_img = ?",
            "u_cv = ?",
            "u_active = ?",
            "u_is_del = ?",
            "u_updated_at = ?"
        ];
        
        $types = "ssssssssssssssiis";
        $params = [
            $user_id, $first_name, $middle_name, $last_name, $gender, 
            $email, $mobile, $city, $state, $country,
            $zip_code, $street_address, $organization,
            $profile_image, $cv, $active, $is_deleted,
            $updated_at
        ];
        
        // Add password if provided
        if (!empty($password)) {
            array_splice($updateFields, 13, 0, "u_pass = ?");
            $types = substr_replace($types, 's', 13, 0);
            array_splice($params, 13, 0, $password);
        }
        
        $params[] = $u_id; // Add u_id for WHERE clause
        
        $updateQuery = "UPDATE user_details SET " . implode(", ", $updateFields) . " WHERE u_id = ?";
        $stmt = $conn->prepare($updateQuery);
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        
        $stmt->bind_param($types, ...$params);
        if (!$stmt->execute()) {
            throw new Exception("Update failed: " . $stmt->error);
        }
        
        echo json_encode(["success" => true, "message" => "User updated successfully"]);
        $stmt->close();
    } else {
        // User doesn't exist - INSERT
        $insertQuery = "INSERT INTO user_details (
            user_id, u_fname, u_mname, u_lname, u_gender, 
            u_email, u_mob, u_city, u_state, u_country, 
            u_zip_code, u_street_addr, u_organization, u_pass, 
            u_pro_img, u_cv, u_active, u_is_del, u_created_at, u_updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $conn->prepare($insertQuery);
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        
        $stmt->bind_param(
            "ssssssssssssssssiiss", 
            $user_id, $first_name, $middle_name, $last_name, $gender,
            $email, $mobile, $city, $state, $country,
            $zip_code, $street_address, $organization, $password,
            $profile_image, $cv, $active, $is_deleted, $created_at, $updated_at
        );
        
        if (!$stmt->execute()) {
            throw new Exception("Insert failed: " . $stmt->error);
        }
        
        echo json_encode([
            "success" => true,
            "message" => "New user added successfully",
            "inserted_id" => $stmt->insert_id
        ]);
        $stmt->close();
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage(),
        "error_details" => $e->getFile() . ":" . $e->getLine()
    ]);
    
} finally {
    if ($conn !== null && $conn instanceof mysqli) {
        $conn->close();
    }
}
?>
<?php
header("Content-Type: application/json");

// Database connection
$con = new mysqli('localhost', 'root', '', 'geoma7i3_geomaticx_et_dms');

// Check connection
if ($con->connect_error) {
    die(json_encode(["status" => "error", "message" => "Connection failed: " . $con->connect_error]));
}

// Check if role_name is provided
if (!isset($_GET['role_name'])) {
    echo json_encode(["status" => "error", "message" => "Missing role_name parameter"]);
    exit;
}

$role_name = $_GET['role_name'];

// Prepare SQL query with JOIN to fetch role_id, role_name, and attn_id
$sql = "
    SELECT ur.role_id, ur.role_name, ad.attn_id
    FROM user_role ur
    LEFT JOIN assigned_role ar ON ur.role_id = ar.role_id
    LEFT JOIN user_details ud ON ar.u_id = ud.u_id
    LEFT JOIN attendance_details ad ON ud.user_id = ad.user_id
    WHERE ur.role_name = ?
";

// Prepare and execute the query
$stmt = $con->prepare($sql);
$stmt->bind_param("s", $role_name);
$stmt->execute();
$result = $stmt->get_result();

// Fetch results
$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

// Close connections
$stmt->close();
$con->close();

// Return JSON response
echo json_encode(["status" => "success", "data" => $data]);
?>

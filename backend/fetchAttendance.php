<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include 'config.php';

$data = json_decode(file_get_contents("php://input"));

if (!$data) {
    echo json_encode(["success" => false, "message" => "No input data received"]);
    exit;
}

$user_id = $data->user_id ?? null;
$start_date = $data->start_date ?? null;
$end_date = $data->end_date ?? null;

if (!$user_id || !$start_date || !$end_date) {
    echo json_encode(["success" => false, "message" => "Missing parameters"]);
    exit;
}

$query = "SELECT * FROM attendance_details
          WHERE user_id = ? 
          AND DATE(login_timestamp) BETWEEN ? AND ? 
          ORDER BY login_timestamp";

$stmt = $conn->prepare($query);

if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Query preparation failed: " . $conn->error]);
    exit;
}

$stmt->bind_param("iss", $user_id, $start_date, $end_date);
$stmt->execute();
$result = $stmt->get_result();

$attendance = array();
while ($row = $result->fetch_assoc()) {
    $attendance[] = $row;
}

echo json_encode([
    'success' => true,
    'attendance' => $attendance
]);

$stmt->close();
$conn->close();
?>

<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST, GET");

$host = "localhost";  
$username = "root";   
$password = "";       
$dbname = "geoma7i3_geomaticx_et_dms"; 
$port = 3307;         

$conn = new mysqli($host, $username, $password, $dbname, $port);


// Check connection
if ($conn->connect_error) {
    die(json_encode(["error" => "Database connection failed: " . $conn->connect_error]));
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === "POST") {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data) {
        die(json_encode(["error" => "Invalid JSON data"]));
    }

    $stmt = $conn->prepare("INSERT INTO exp_db (title, type, amount, location, createdBy, dateSubmitted, status) 
                            VALUES (?, ?, ?, ?, ?, ?, ?)");
    if (!$stmt) {
        die(json_encode(["error" => "Prepare failed: " . $conn->error]));
    }

    $stmt->bind_param("sssssss", $data['title'], $data['type'], $data['amount'], 
                      $data['location'], $data['createdBy'], $data['dateSubmitted'], $data['status']);

    if ($stmt->execute()) {
        die(json_encode(["message" => "Expense added successfully"]));
    } else {
        die(json_encode(["error" => "Failed to add expense: " . $stmt->error]));
    }
    $stmt->close();
}

if ($method === "GET") {
     $result = $conn->query("SELECT
        ed.expense_product_name AS title,
        eh.expense_head_title AS type,
        ed.expense_product_amount AS amount,
        '' AS location, 
        '' AS createdBy, 
        DATE(ed.expense_product_created_at) AS dateSubmitted,
        CASE
            WHEN ed.expense_product_is_del = 0 THEN 'Active'
            ELSE 'Deleted'
        END AS status
    FROM expense_details ed
    JOIN expense_heads eh ON ed.expense_head_id = eh.expense_head_id");


    $expenses = [];

    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $expenses[] = $row;
        }
        die(json_encode($expenses));
    } else {
        die(json_encode(["error" => "Failed to fetch expenses: " . $conn->error]));
    }
}

$conn->close();

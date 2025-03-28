<?php
header('Content-Type: application/json');

// Allow from any origin
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');    // cache for 1 day
}

// Access-Control headers are received during OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: POST, OPTIONS");

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");

    exit(0);
}
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

error_reporting(E_ALL & ~E_NOTICE);
include "lib/config.php";

// Check if user is authenticated
if (!isset($_SERVER['HTTP_AUTHORIZATION'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$auth_header = $_SERVER['HTTP_AUTHORIZATION'];
$session_id = str_replace('Session ', '', $auth_header);

// Validate session ID
session_id($session_id);
session_start();
if (!isset($_SESSION['userid'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid session']);
    exit;
}

// Get the raw POST data
$data = json_decode(file_get_contents('php://input'), true);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

if (empty($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid data']);
    exit;
}

// Required fields
$required_fields = ['leave_title', 'leave_ground', 'leave_from_date', 'leave_to_date', 'leave_comment', 'leave_track_submitted_to'];
foreach ($required_fields as $field) {
    if (empty($data[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
        exit;
    }
}

try {
    $u_id = $_SESSION['userid'];
    $leave_track_created_at = date("Y-m-d h:i:s", time());
    $leave_title = mysqli_real_escape_string($con, trim($data['leave_title']));
    $leave_comment = mysqli_real_escape_string($con, trim($data['leave_comment']));
    $leave_from_date = trim($data['leave_from_date']);
    $leave_to_date = trim($data['leave_to_date']);
    $leave_ground = mysqli_real_escape_string($con, trim($data['leave_ground']));
    $leave_track_submitted_to = mysqli_real_escape_string($con, trim($data['leave_track_submitted_to']));

    $leave_track_query = "INSERT INTO `leave_track_details`(`leave_id`, `leave_title`, `leave_ground`, `leave_from_date`, `leave_to_date`, `leave_comment`, `leave_track_created_by`, `leave_track_created_at`, `leave_track_submitted_to`) 
                          VALUES ('','$leave_title','$leave_ground','$leave_from_date','$leave_to_date','$leave_comment','$u_id','$leave_track_created_at','$leave_track_submitted_to')";

    $run_leave_track_query = mysqli_query($con, $leave_track_query);

    if (!$run_leave_track_query) {
        throw new Exception(mysqli_error($con));
    }

    $leave_id = mysqli_insert_id($con);

    // Handle attachments if any
    if (!empty($data['attachments'])) {
        foreach ($data['attachments'] as $attachment) {
            $doc_name = mysqli_real_escape_string($con, trim($attachment['name']));
            $leave_doc_path = ""; // In real app, you would save the file and get the path

            $insert_leave_track_doc_query = "INSERT INTO `leave_track_documents`(`doc_id`, `leave_id`, `doc_name`, `doc_file_url`) 
                                            VALUES ('','$leave_id','$doc_name','" . mysqli_real_escape_string($con, $leave_doc_path) . "')";
            mysqli_query($con, $insert_leave_track_doc_query);
        }
    }

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Leave request submitted successfully',
        'leave_id' => $leave_id
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
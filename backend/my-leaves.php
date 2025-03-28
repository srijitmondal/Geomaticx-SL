<?php
// Enable CORS for localhost testing
header("Access-Control-Allow-Origin: http://localhost:8081");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Accept, Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight (OPTIONS) request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get user ID from the request parameters
if (!isset($_GET['userId']) || empty($_GET['userId'])) {
    echo json_encode(['status' => 'error', 'message' => 'User ID is required']);
    exit();
}

$user_id = intval($_GET['userId']); // Ensure it's an integer

// Database connection settings
$servername = "localhost";
$username = "root"; // Replace with actual database username
$password = ""; // Replace with actual database password
$dbname = "geoma7i3_geomaticx_et_dms"; // Replace with actual database name

// Create database connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed: ' . $conn->connect_error]);
    exit();
}

// Prepare SQL query
$sql = "SELECT * FROM leave_track_details WHERE leave_track_created_by = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

// Initialize response array
$jsonData = [];

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        // Convert `leave_ground` to human-readable text
        $leaveType = match ($row['leave_ground']) {
            0 => "Casual Leave",
            1 => "Medical Leave",
            2 => "Half Day Leave",
            default => "Unknown"
        };

        // Convert `leave_track_status` to human-readable text
        $status = match ($row['leave_track_status']) {
            null => "Unattended",
            0 => "Rejected",
            1 => "Approved",
            2 => "Suspended",
            default => "Unknown"
        };

        // Format JSON response
        $jsonData[] = [
            'leave_id' => $row['leave_id'],
            'leave_title' => $row['leave_title'],
            'leave_ground' => $row['leave_ground'],
            'leave_ground_text' => $leaveType,
            'leave_from_date' => $row['leave_from_date'],
            'leave_to_date' => $row['leave_to_date'],
            'leave_comment' => $row['leave_comment'],
            'leave_acpt_rej_remarks' => $row['leave_acpt_rej_remarks'],
            'leave_track_status' => $row['leave_track_status'],
            'leave_track_status_text' => $status,
            'leave_track_created_by' => $row['leave_track_created_by'],
            'leave_track_created_at' => $row['leave_track_created_at'],
            'leave_track_updated_at' => $row['leave_track_updated_at'],
            'leave_track_submitted_to' => $row['leave_track_submitted_to'],
            'leave_track_approved_rejected_by' => $row['leave_track_approved_rejected_by'],
            'leave_track_approved_rejected_at' => $row['leave_track_approved_rejected_at']
        ];
    }
} else {
    $jsonData = ['status' => 'error', 'message' => 'No leave records found'];
}

// Close database connection
$conn->close();

// Send JSON response
echo json_encode($jsonData);
?>
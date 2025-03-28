<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
// Database connection settings
$servername = "localhost";
$username = "root"; // Replace with your database username
$password = ""; // Replace with your database password
$dbname = "geoma7i3_geomaticx_et_dms"; // Replace with your database name

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// SQL query to fetch all leaves
$sql = "SELECT * FROM leave_track_details";
$result = $conn->query($sql);

// Check if the request is expecting JSON (like from React Native)
if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) {
    header('Content-Type: application/json');

    $jsonData = array();
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            // Map leave_ground values to human-readable text
            $leaveType = "";
            switch ($row['leave_ground']) {
                case 0:
                    $leaveType = "Casual Leave";
                    break;
                case 1:
                    $leaveType = "Medical Leave";
                    break;
                case 2:
                    $leaveType = "Half Day Leave";
                    break;
                default:
                    $leaveType = "Unknown";
            }

            // Map leave_track_status values to human-readable text
            $status = "";
            switch ($row['leave_track_status']) {
                case null:
                    $status = "Unattended";
                    break;
                case 0:
                    $status = "Rejected";
                    break;
                case 1:
                    $status = "Approved";
                    break;
                case 2:
                    $status = "Suspended";
                    break;
                default:
                    $status = "Unknown";
            }

            // Format the data for JSON response
            $jsonData[] = array(
                'leave_id' => $row['leave_id'],
                'leave_title' => $row['leave_title'],
                'leave_ground' => $row['leave_ground'],
                'leave_ground_text' => $leaveType,
                'leave_from_date' => $row['leave_from_date'],
                'leave_to_date' => $row['leave_to_date'],
                'leave_comment' => $row['leave_comment'],
                'leave_acpt_rql_remarks' => $row['leave_acpt_rql_remarks'],
                'leave_track_status' => $row['leave_track_status'],
                'leave_track_status_text' => $status,
                'leave_track_created_by' => $row['leave_track_created_by'],
                'leave_track_created_at' => $row['leave_track_created_at'],
                'leave_track_updated_at' => $row['leave_track_updated_at'],
                'leave_track_submitted_to' => $row['leave_track_submitted_to'],
                'leave_track_approved_rejected_by' => $row['leave_track_approved_rejected_by'],
                'leave_track_approved_rejected_at' => $row['leave_track_approved_rejected_at']
            );
        }
    }
    echo json_encode($jsonData);
    exit();
}

// If not a JSON request, output HTML
echo "<!DOCTYPE html>
<html>
<head>
    <title>All Leaves</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        tr:nth-child(even) { background-color: #f9f9f9; }
    </style>
</head>
<body>
    <h1>All Leave Records</h1>";

if ($result->num_rows > 0) {
    // Start table
    echo "<table>
        <tr>
            <th>Leave ID</th>
            <th>Title</th>
            <th>Leave Type</th>
            <th>From Date</th>
            <th>To Date</th>
            <th>Comments</th>
            <th>Remarks</th>
            <th>Status</th>
            <th>Created By</th>
            <th>Created At</th>
            <th>Updated At</th>
            <th>Submitted To</th>
            <th>Approved/Rejected By</th>
            <th>Approved/Rejected At</th>
        </tr>";

    // Output data of each row
    while ($row = $result->fetch_assoc()) {
        // Map leave_ground values to human-readable text
        $leaveType = "";
        switch ($row['leave_ground']) {
            case 0:
                $leaveType = "Casual Leave";
                break;
            case 1:
                $leaveType = "Medical Leave";
                break;
            case 2:
                $leaveType = "Half Day Leave";
                break;
            default:
                $leaveType = "Unknown";
        }

        // Map leave_track_status values to human-readable text
        $status = "";
        switch ($row['leave_track_status']) {
            case null:
                $status = "Unattended";
                break;
            case 0:
                $status = "Rejected";
                break;
            case 1:
                $status = "Approved";
                break;
            case 2:
                $status = "Suspended";
                break;
            default:
                $status = "Unknown";
        }

        echo "<tr>
            <td>" . $row['leave_id'] . "</td>
            <td>" . $row['leave_title'] . "</td>
            <td>" . $leaveType . "</td>
            <td>" . $row['leave_from_date'] . "</td>
            <td>" . $row['leave_to_date'] . "</td>
            <td>" . $row['leave_comment'] . "</td>
            <td>" . $row['leave_acpt_rql_remarks'] . "</td>
            <td>" . $status . "</td>
            <td>" . $row['leave_track_created_by'] . "</td>
            <td>" . $row['leave_track_created_at'] . "</td>
            <td>" . $row['leave_track_updated_at'] . "</td>
            <td>" . $row['leave_track_submitted_to'] . "</td>
            <td>" . $row['leave_track_approved_rejected_by'] . "</td>
            <td>" . $row['leave_track_approved_rejected_at'] . "</td>
        </tr>";
    }
    echo "</table>";
} else {
    echo "0 results found";
}

// Close connection
$conn->close();

echo "</body>
</html>";
?>
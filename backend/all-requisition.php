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

// SQL query to fetch all requisitions
$sql = "SELECT erd.*, 
               ud.u_fname, ud.u_mname, ud.u_lname 
        FROM expense_requisition_details erd
        LEFT JOIN user_details ud ON erd.requisition_created_by = ud.u_id ORDER BY erd.requisition_id DESC";
$result = $conn->query($sql);




// Check if the request is expecting JSON (like from React Native)
if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) {
    header('Content-Type: application/json');

    $jsonData = array();
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            // Map requisition_type values to human-readable text
            // $requisitionType = "";
            // switch ($row['requisition_type']) {
            //     case 0:
            //         $requisitionType = "Office Supplies";
            //         break;
            //     case 1:
            //         $requisitionType = "Travel Request";
            //         break;
            //     case 2:
            //         $requisitionType = "Equipment Purchase";
            //         break;
            //     default:
            //         $requisitionType = "Other";
            // }

            // // Map requisition_status values to human-readable text
            // $status = "";
            // switch ($row['requisition_status']) {
            //     case null:
            //         $status = "Unattended";
            //         break;
            //     case 0:
            //         $status = "Rejected";
            //         break;
            //     case 1:
            //         $status = "Approved";
            //         break;
            //     case 2:
            //         $status = "Partially Approved";
            //         break;
            //     case 3:
            //         $status = "Pending";
            //         break;
            //     default:
            //         $status = "Unknown";
            // }

            // Format the data for JSON response
            $jsonData[] = array(
                'requisition_id' => (int) $row['requisition_id'],
                'requisition_title' => $row['requisition_title'],
                'requisition_type' => (int) $row['requisition_type'],
                'requisition_date' => $row['requisition_date'],
                'requisition_comment' => $row['requisition_comment'],
                'requisition_status' => isset($row['requisition_status']) ? (int) $row['requisition_status'] : null,
                'requisition_created_by' => (int) $row['requisition_created_by'],
                'requisition_created_at' => $row['requisition_created_at'],
                'requisition_updated_at' => $row['requisition_updated_at'],
                'created_by_full_name' => trim($row['u_fname'] . " " . $row['u_mname'] . " " . $row['u_lname'])
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
    <title>All Requisitions</title>
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
    <h1>All Requisition Records</h1>";

if ($result->num_rows > 0) {
    // Start table
    echo "<table>
        <tr>
            <th>Requisition ID</th>
            <th>Title</th>
            <th>Type</th>
            <th>Date</th>
            <th>Comments</th>
            <th>Status</th>
            <th>Created By</th>
            <th>Created At</th>
            <th>Updated At</th>
        </tr>";

    // Output data of each row
    while ($row = $result->fetch_assoc()) {
        // Map requisition_type values to human-readable text
        // $requisitionType = "";
        // switch ($row['requisition_type']) {
        //     case 0:
        //         $requisitionType = "Office Supplies";
        //         break;
        //     case 1:
        //         $requisitionType = "Travel Request";
        //         break;
        //     case 2:
        //         $requisitionType = "Equipment Purchase";
        //         break;
        //     default:
        //         $requisitionType = "Other";
        // }

        // // Map requisition_status values to human-readable text
        // $status = "";
        // switch ($row['requisition_status']) {
        //     case null:
        //         $status = "Unattended";
        //         break;
        //     case 0:
        //         $status = "Rejected";
        //         break;
        //     case 1:
        //         $status = "Approved";
        //         break;
        //     case 2:
        //         $status = "Partially Approved";
        //         break;
        //     case 3:
        //         $status = "Pending";
        //         break;
        //     default:
        //         $status = "Unknown";
        // }

        echo "<tr>
            <td>" . $row['requisition_id'] . "</td>
            <td>" . $row['requisition_title'] . "</td>
            <td>" . $row['requisition_type'] . "</td>
        
            <td>" . $row['requisition_date'] . "</td>
            <td>" . $row['requisition_comment'] . "</td>
     
            <td>" . $row['requisition_created_by'] . "</td>
            <td>" . $row['requisition_created_at'] . "</td>
            <td>" . $row['requisition_updated_at'] . "</td>
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
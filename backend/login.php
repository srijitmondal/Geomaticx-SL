<?php
session_start();
header("Access-Control-Allow-Origin: *"); // Allow all origins (Change * to specific domains in production)
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow POST and GET requests
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight requests (OPTIONS method)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Continue with the rest of your PHP code...
?>
<?php
// api.php

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set response header to JSON
header('Content-Type: application/json');

// Initialize response array
$response = [
    'status' => 'error',
    'message' => 'Invalid request',
    'data' => []
];

// Database connection
$con = new mysqli('localhost', 'root', '', 'geoma7i3_geomaticx_et_dms'); // Replace with your database credentials

// Check database connection
if ($con->connect_error) {
    $response['message'] = 'Database connection failed: ' . $con->connect_error;
    echo json_encode($response);
    exit;
}

// Handle POST request (login)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get raw JSON input
    $jsonInput = file_get_contents('php://input');
    $data = json_decode($jsonInput, true);

    // Validate JSON input
    if (json_last_error() === JSON_ERROR_NONE && isset($data['u_identify']) && isset($data['u_pass'])) {
        $u_identify = trim($data['u_identify']);
        $u_pass = md5(trim($data['u_pass'])); // Hash the input password for comparison

        // Query the database to find the user
        $query = "SELECT * FROM user_details WHERE (u_email = ? OR u_mob = ?) AND u_pass = ?";
        $stmt = $con->prepare($query);

        if ($stmt) {
            $stmt->bind_param('sss', $u_identify, $u_identify, $u_pass);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                $user = $result->fetch_assoc();

                // Validate login
                if ($user['u_active'] == 0) {
                    $response['message'] = 'You are deactivated! Need admin permission for login!';
                } else {
                    // Set session variables
                    $_SESSION['useremail'] = $user['u_email'];
                    $_SESSION['userid'] = $user['u_id'];
                    $_SESSION['usermob'] = $user['u_mob'];
                    $_SESSION['userfullname'] = $user['u_fname'] . " " . $user['u_mname'] . " " . $user['u_lname'];
                    $_SESSION['user city'] = $user['u_city'];
                    $_SESSION['user state'] = $user['u_state'];
                    $_SESSION['user country'] = $user['u_country'];
                    $_SESSION['user zip_code'] = $user['u_zip_code'];
                    $_SESSION['user street address'] = $user['u_street_addr'];

                    $response['status'] = 'success';
                    $response['message'] = 'Login successful';
                    $response['data'] = [
                        'userid' => $user['u_id'],
                        'useremail' => $user['u_email'],
                        'usermob' => $user['u_mob'],
                        'userfullname' => $user['u_fname'] . " " . $user['u_mname'] . " " . $user['u_lname'],
                        'user city' => $user['u_city'],
                        'user state' => $user['u_state'],
                        'user country' => $user['u_country'],
                        'user zip_code' => $user['u_zip_code'],
                        'user street address' => $user['u_street_addr'],
                    ];
                }
            } else {
                $response['message'] = 'Invalid login credentials';
            }

            $stmt->close();
        } else {
            $response['message'] = 'Database query preparation failed';
        }
    } else {
        $response['message'] = 'Invalid JSON input';
    }
} else {
    $response['message'] = 'Only POST requests are allowed';
}

// Send JSON response
echo json_encode($response);
?>
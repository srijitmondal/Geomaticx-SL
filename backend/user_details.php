<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

$host = "localhost";
$dbname = "geoma7i3_geomaticx_et_dms";
$username = "root";
$password = "";

try {
    // Connect to the database
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Query to fetch all user details along with their roles
    $stmt = $pdo->prepare("
        SELECT 
            ud.u_id,
            ud.user_id,
            ud.u_fname,
            ud.u_mname,
            ud.u_lname,
            CONCAT(ud.u_fname, ' ', ud.u_mname, ' ', ud.u_lname) AS user,
            ud.u_gender,
            ud.u_email,
            ud.u_mob,
            ud.u_city,
            ud.u_state,
            ud.u_country,
            ud.u_zip_code,
            ud.u_street_addr,
            ud.u_organization,
            ud.u_pro_img,
            ud.u_cv,
            ud.u_created_at,
            ud.u_updated_at,
            ud.u_active,
            ur.role_name
        FROM user_details ud
        LEFT JOIN assigned_role ar ON ud.u_id = ar.u_id AND ar.ass_role_del = 0
        LEFT JOIN user_role ur ON ar.role_id = ur.role_id AND ur.role_is_del = 0
        WHERE ud.u_is_del = 0;
    ");

    $stmt->execute();

    // Fetch all results
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Return JSON response
    echo json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>

$ErrorActionPreference = 'Stop'

$base = 'http://localhost/fox_petroleum/public/api'
$results = New-Object System.Collections.Generic.List[object]

function Add-Check {
    param(
        [string]$Role,
        [string]$Step,
        [string]$Method,
        [string]$Endpoint,
        [string]$Expected,
        [int]$Actual,
        [bool]$Pass,
        [string]$Note = ''
    )

    $results.Add([pscustomobject]@{
        Role = $Role
        Step = $Step
        Method = $Method
        Endpoint = $Endpoint
        Expected = $Expected
        Actual = $Actual
        Pass = $Pass
        Note = $Note
    }) | Out-Null
}

function Invoke-Api {
    param(
        [Parameter(Mandatory = $true)][string]$Method,
        [Parameter(Mandatory = $true)][string]$Url,
        [string]$Token,
        $BodyObject
    )

    $headers = @{ Accept = 'application/json' }
    if ($Token) {
        $headers['Authorization'] = "Bearer $Token"
    }

    $invokeParams = @{
        Uri = $Url
        Method = $Method
        Headers = $headers
        UseBasicParsing = $true
    }

    if ($null -ne $BodyObject) {
        $invokeParams['ContentType'] = 'application/json'
        $invokeParams['Body'] = ($BodyObject | ConvertTo-Json -Depth 30 -Compress)
    }

    $status = 0
    $content = ''

    try {
        $resp = Invoke-WebRequest @invokeParams
        $status = [int]$resp.StatusCode
        $content = $resp.Content
    } catch {
        if ($_.Exception.Response) {
            $status = [int]$_.Exception.Response.StatusCode
            $stream = $_.Exception.Response.GetResponseStream()
            if ($stream) {
                $reader = New-Object System.IO.StreamReader($stream)
                $content = $reader.ReadToEnd()
            }
        } else {
            $status = 0
            $content = $_.Exception.Message
        }
    }

    $json = $null
    if ($content) {
        try {
            $json = $content | ConvertFrom-Json
        } catch {
            $json = $null
        }
    }

    return [pscustomobject]@{
        Status = $status
        Content = $content
        Json = $json
    }
}

# ------------------
# 1) Logins
# ------------------
$adminLogin = Invoke-Api -Method 'POST' -Url "$base/auth/login" -BodyObject @{ email = 'admin@foxpetroleum.com'; password = 'password' }
Add-Check -Role 'admin' -Step 'Login' -Method 'POST' -Endpoint '/auth/login' -Expected '200' -Actual $adminLogin.Status -Pass ($adminLogin.Status -eq 200)

$chauffeurLogin = Invoke-Api -Method 'POST' -Url "$base/auth/login" -BodyObject @{ email = 'chauffeur@foxpetroleum.com'; password = 'password' }
Add-Check -Role 'chauffeur' -Step 'Login' -Method 'POST' -Endpoint '/auth/login' -Expected '200' -Actual $chauffeurLogin.Status -Pass ($chauffeurLogin.Status -eq 200)

$clientLogin = Invoke-Api -Method 'POST' -Url "$base/auth/login" -BodyObject @{ email = 'client@foxpetroleum.com'; password = 'password' }
Add-Check -Role 'client' -Step 'Login' -Method 'POST' -Endpoint '/auth/login' -Expected '200' -Actual $clientLogin.Status -Pass ($clientLogin.Status -eq 200)

$adminToken = $adminLogin.Json.data.token
$chauffeurToken = $chauffeurLogin.Json.data.token
$clientToken = $clientLogin.Json.data.token

if (-not $adminToken -or -not $chauffeurToken -or -not $clientToken) {
    Write-Output 'Impossible de poursuivre: token manquant pour au moins un role.'
    $results | Format-Table -AutoSize
    exit 0
}

# ------------------
# 2) Admin checks + discounts CRUD
# ------------------
$adminMe = Invoke-Api -Method 'GET' -Url "$base/auth/me" -Token $adminToken
Add-Check -Role 'admin' -Step 'Auth Me' -Method 'GET' -Endpoint '/auth/me' -Expected '200' -Actual $adminMe.Status -Pass ($adminMe.Status -eq 200)

$customersResp = Invoke-Api -Method 'GET' -Url "$base/customers?search=client@foxpetroleum.com" -Token $adminToken
Add-Check -Role 'admin' -Step 'Find Client Customer' -Method 'GET' -Endpoint '/customers?search=client@foxpetroleum.com' -Expected '200' -Actual $customersResp.Status -Pass ($customersResp.Status -eq 200)

$clientCustomer = $null
if ($customersResp.Status -eq 200 -and $customersResp.Json -and $customersResp.Json.data) {
    $clientCustomer = @($customersResp.Json.data | Where-Object { $_.email -eq 'client@foxpetroleum.com' }) | Select-Object -First 1
}

if ($clientCustomer) {
    $updateCustomer = Invoke-Api -Method 'PUT' -Url "$base/customers/$($clientCustomer.id)" -Token $adminToken -BodyObject @{ address = '123 Rue Test QA'; city = 'Casablanca' }
    Add-Check -Role 'admin' -Step 'Set Client Default Address' -Method 'PUT' -Endpoint "/customers/$($clientCustomer.id)" -Expected '200' -Actual $updateCustomer.Status -Pass ($updateCustomer.Status -eq 200)
} else {
    Add-Check -Role 'admin' -Step 'Set Client Default Address' -Method 'PUT' -Endpoint '/customers/{id}' -Expected '200' -Actual 0 -Pass $false -Note 'client@foxpetroleum.com introuvable'
}

$discountCode = 'E2E' + (Get-Date -Format 'MMddHHmmss')
$discountCreate = Invoke-Api -Method 'POST' -Url "$base/admin/discounts" -Token $adminToken -BodyObject @{
    code = $discountCode
    name = 'Reduction E2E QA'
    description = 'Mini test guide'
    type = 'percent'
    value = 8
    min_order_amount = 0
    is_active = $true
}
Add-Check -Role 'admin' -Step 'Create Discount' -Method 'POST' -Endpoint '/admin/discounts' -Expected '201' -Actual $discountCreate.Status -Pass ($discountCreate.Status -eq 201)

$discountId = $null
if ($discountCreate.Status -eq 201 -and $discountCreate.Json -and $discountCreate.Json.data) {
    $discountId = $discountCreate.Json.data.id
}

if ($discountId) {
    $discountGet = Invoke-Api -Method 'GET' -Url "$base/admin/discounts/$discountId" -Token $adminToken
    Add-Check -Role 'admin' -Step 'Get Discount' -Method 'GET' -Endpoint "/admin/discounts/$discountId" -Expected '200' -Actual $discountGet.Status -Pass ($discountGet.Status -eq 200)

    $discountUpdate = Invoke-Api -Method 'PUT' -Url "$base/admin/discounts/$discountId" -Token $adminToken -BodyObject @{ is_active = $false; name = 'Reduction E2E QA MAJ' }
    Add-Check -Role 'admin' -Step 'Update Discount' -Method 'PUT' -Endpoint "/admin/discounts/$discountId" -Expected '200' -Actual $discountUpdate.Status -Pass ($discountUpdate.Status -eq 200)

    $discountDelete = Invoke-Api -Method 'DELETE' -Url "$base/admin/discounts/$discountId" -Token $adminToken
    Add-Check -Role 'admin' -Step 'Delete Discount' -Method 'DELETE' -Endpoint "/admin/discounts/$discountId" -Expected '200' -Actual $discountDelete.Status -Pass ($discountDelete.Status -eq 200)
}

# ------------------
# 3) Chauffeur incidents flow
# ------------------
$chauffeurDeliveries = Invoke-Api -Method 'GET' -Url "$base/deliveries" -Token $chauffeurToken
Add-Check -Role 'chauffeur' -Step 'List Deliveries' -Method 'GET' -Endpoint '/deliveries' -Expected '200' -Actual $chauffeurDeliveries.Status -Pass ($chauffeurDeliveries.Status -eq 200)

$targetDelivery = $null
if ($chauffeurDeliveries.Status -eq 200 -and $chauffeurDeliveries.Json -and $chauffeurDeliveries.Json.data) {
    $targetDelivery = @($chauffeurDeliveries.Json.data | Where-Object { $_.status -in @('in_progress', 'planned') }) | Select-Object -First 1
    if (-not $targetDelivery) {
        $targetDelivery = @($chauffeurDeliveries.Json.data) | Select-Object -First 1
    }
}

$geoDeliveryId = $null
$geoOriginalStatus = $null
$geoStatusChanged = $false
$geoLat = 33.589886
$geoLng = -7.603869

if ($targetDelivery) {
    $geoDeliveryId = [int]$targetDelivery.id
    $geoOriginalStatus = [string]$targetDelivery.status

    if ($geoOriginalStatus -eq 'planned') {
        $geoSetInProgress = Invoke-Api -Method 'PATCH' -Url "$base/deliveries/$geoDeliveryId/status" -Token $chauffeurToken -BodyObject @{ status = 'in_progress'; latitude = $geoLat; longitude = $geoLng }
        $geoStatusChanged = ($geoSetInProgress.Status -eq 200)
        Add-Check -Role 'chauffeur' -Step 'Set Delivery In Progress (Geo)' -Method 'PATCH' -Endpoint "/deliveries/$geoDeliveryId/status" -Expected '200' -Actual $geoSetInProgress.Status -Pass $geoStatusChanged
    }

    $geoUpdate = Invoke-Api -Method 'POST' -Url "$base/deliveries/$geoDeliveryId/update-location" -Token $chauffeurToken -BodyObject @{ latitude = $geoLat; longitude = $geoLng }
    Add-Check -Role 'chauffeur' -Step 'Update Delivery Location (Geo)' -Method 'POST' -Endpoint "/deliveries/$geoDeliveryId/update-location" -Expected '200' -Actual $geoUpdate.Status -Pass ($geoUpdate.Status -eq 200)

    $geoShow = Invoke-Api -Method 'GET' -Url "$base/deliveries/$geoDeliveryId" -Token $chauffeurToken
    $geoCoordsPersisted = $false
    $geoLogHasLocationUpdate = $false
    if ($geoShow.Status -eq 200 -and $geoShow.Json -and $geoShow.Json.data) {
        $latValue = $geoShow.Json.data.latitude
        $lngValue = $geoShow.Json.data.longitude

        if ($null -ne $latValue -and $null -ne $lngValue) {
            $latDelta = [Math]::Abs(([double]$latValue) - $geoLat)
            $lngDelta = [Math]::Abs(([double]$lngValue) - $geoLng)
            $geoCoordsPersisted = ($latDelta -le 0.001 -and $lngDelta -le 0.001)
        }

        if ($geoShow.Json.data.gpsTrackingLog) {
            $geoLogHasLocationUpdate = @($geoShow.Json.data.gpsTrackingLog | Where-Object { $_.event -eq 'location_update' }).Count -gt 0
        }
    }

    Add-Check -Role 'chauffeur' -Step 'Verify Delivery Coordinates (Geo)' -Method 'GET' -Endpoint "/deliveries/$geoDeliveryId" -Expected '200 + coords persisted' -Actual $geoShow.Status -Pass ($geoShow.Status -eq 200 -and $geoCoordsPersisted)
    Add-Check -Role 'chauffeur' -Step 'Verify GPS Log Entry (Geo)' -Method 'GET' -Endpoint "/deliveries/$geoDeliveryId" -Expected 'location_update event' -Actual $geoShow.Status -Pass ($geoShow.Status -eq 200 -and $geoLogHasLocationUpdate)

    $trackDriversResp = Invoke-Api -Method 'GET' -Url "$base/deliveries/track-drivers" -Token $adminToken
    $driverTracked = $false
    if ($trackDriversResp.Status -eq 200 -and $trackDriversResp.Json -and $trackDriversResp.Json.data) {
        $driverTracked = @($trackDriversResp.Json.data | Where-Object {
            $_.chauffeur -and [int]$_.chauffeur.id -eq [int]$targetDelivery.chauffeurId -and $_.currentLocation -and $null -ne $_.currentLocation.latitude -and $null -ne $_.currentLocation.longitude
        }).Count -gt 0
    }

    $expectTracked = ($geoOriginalStatus -eq 'in_progress' -or $geoStatusChanged)
    $trackPass = if ($expectTracked) { ($trackDriversResp.Status -eq 200 -and $driverTracked) } else { ($trackDriversResp.Status -eq 200) }
    $trackExpected = if ($expectTracked) { '200 + chauffeur tracked' } else { '200' }
    Add-Check -Role 'admin' -Step 'Track Drivers (Geo)' -Method 'GET' -Endpoint '/deliveries/track-drivers' -Expected $trackExpected -Actual $trackDriversResp.Status -Pass $trackPass
} else {
    Add-Check -Role 'chauffeur' -Step 'Geolocation Tests' -Method 'POST' -Endpoint '/deliveries/{id}/update-location' -Expected '200' -Actual 0 -Pass $false -Note 'Aucune livraison chauffeur disponible'
}

$incidentDeliveryId = $null
$incidentCreatedByTest = $false

if ($targetDelivery) {
    $incidentCreate = Invoke-Api -Method 'POST' -Url "$base/deliveries/$($targetDelivery.id)/incident" -Token $chauffeurToken -BodyObject @{ incident_report = 'Incident E2E chauffeur - declaration.' }
    $incidentCreatePass = ($incidentCreate.Status -eq 201 -or $incidentCreate.Status -eq 422)
    Add-Check -Role 'chauffeur' -Step 'Create Incident' -Method 'POST' -Endpoint "/deliveries/$($targetDelivery.id)/incident" -Expected '201 or 422' -Actual $incidentCreate.Status -Pass $incidentCreatePass

    if ($incidentCreate.Status -eq 201) {
        $incidentDeliveryId = [int]$targetDelivery.id
        $incidentCreatedByTest = $true
    }
}

if (-not $incidentDeliveryId) {
    $chauffeurIncidents = Invoke-Api -Method 'GET' -Url "$base/incidents" -Token $chauffeurToken
    Add-Check -Role 'chauffeur' -Step 'List Incidents' -Method 'GET' -Endpoint '/incidents' -Expected '200' -Actual $chauffeurIncidents.Status -Pass ($chauffeurIncidents.Status -eq 200)

    if ($chauffeurIncidents.Status -eq 200 -and $chauffeurIncidents.Json -and $chauffeurIncidents.Json.data) {
        $firstIncident = @($chauffeurIncidents.Json.data) | Select-Object -First 1
        if ($firstIncident) {
            $incidentDeliveryId = [int]$firstIncident.deliveryId
        }
    }
}

if ($incidentDeliveryId) {
    $incidentUpdateReport = Invoke-Api -Method 'PUT' -Url "$base/incidents/$incidentDeliveryId" -Token $chauffeurToken -BodyObject @{ incident_report = 'Incident E2E chauffeur - mise a jour rapport.' }
    Add-Check -Role 'chauffeur' -Step 'Update Incident Report' -Method 'PUT' -Endpoint "/incidents/$incidentDeliveryId" -Expected '200' -Actual $incidentUpdateReport.Status -Pass ($incidentUpdateReport.Status -eq 200)

    $incidentUpdateForbidden = Invoke-Api -Method 'PUT' -Url "$base/incidents/$incidentDeliveryId" -Token $chauffeurToken -BodyObject @{ incident_status = 'resolved'; incident_resolution_notes = 'Tentative non autorisee chauffeur' }
    Add-Check -Role 'chauffeur' -Step 'Update Incident Status (Forbidden)' -Method 'PUT' -Endpoint "/incidents/$incidentDeliveryId" -Expected '403' -Actual $incidentUpdateForbidden.Status -Pass ($incidentUpdateForbidden.Status -eq 403)
} else {
    Add-Check -Role 'chauffeur' -Step 'Incident Update Steps' -Method 'PUT' -Endpoint '/incidents/{delivery}' -Expected '200/403' -Actual 0 -Pass $false -Note 'Aucun incident exploitable pour tests update'
}

# ------------------
# 4) Client order/address flow
# ------------------
$profileData = Invoke-Api -Method 'GET' -Url "$base/client/profile-data" -Token $clientToken
Add-Check -Role 'client' -Step 'Get Profile Data' -Method 'GET' -Endpoint '/client/profile-data' -Expected '200' -Actual $profileData.Status -Pass ($profileData.Status -eq 200)

$clientProducts = Invoke-Api -Method 'GET' -Url "$base/client/products" -Token $clientToken
Add-Check -Role 'client' -Step 'List Products' -Method 'GET' -Endpoint '/client/products' -Expected '200' -Actual $clientProducts.Status -Pass ($clientProducts.Status -eq 200)

$productId = $null
if ($clientProducts.Status -eq 200 -and $clientProducts.Json -and $clientProducts.Json.data) {
    $firstProduct = @($clientProducts.Json.data) | Select-Object -First 1
    if ($firstProduct) { $productId = [int]$firstProduct.id }
}

$orderIdDefault = $null
$orderIdCustom = $null
if ($productId) {
    $orderDefault = Invoke-Api -Method 'POST' -Url "$base/client/orders" -Token $clientToken -BodyObject @{
        items = @(@{ productId = $productId; quantity = 1 })
        useDefaultAddress = $true
        notes = 'E2E adresse par defaut'
    }
    Add-Check -Role 'client' -Step 'Create Order (Default Address)' -Method 'POST' -Endpoint '/client/orders' -Expected '201' -Actual $orderDefault.Status -Pass ($orderDefault.Status -eq 201)
    if ($orderDefault.Status -eq 201 -and $orderDefault.Json -and $orderDefault.Json.data) {
        $orderIdDefault = [int]$orderDefault.Json.data.id
    }

    $orderCustom = Invoke-Api -Method 'POST' -Url "$base/client/orders" -Token $clientToken -BodyObject @{
        items = @(@{ productId = $productId; quantity = 1 })
        useDefaultAddress = $false
        deliveryAddress = '456 Avenue Custom QA'
        deliveryCity = 'Rabat'
        notes = 'E2E adresse personnalisee'
    }
    Add-Check -Role 'client' -Step 'Create Order (Custom Address)' -Method 'POST' -Endpoint '/client/orders' -Expected '201' -Actual $orderCustom.Status -Pass ($orderCustom.Status -eq 201)
    if ($orderCustom.Status -eq 201 -and $orderCustom.Json -and $orderCustom.Json.data) {
        $orderIdCustom = [int]$orderCustom.Json.data.id
    }
} else {
    Add-Check -Role 'client' -Step 'Create Orders' -Method 'POST' -Endpoint '/client/orders' -Expected '201' -Actual 0 -Pass $false -Note 'Aucun produit disponible'
}

$clientOrders = Invoke-Api -Method 'GET' -Url "$base/client/orders" -Token $clientToken
Add-Check -Role 'client' -Step 'List Own Orders' -Method 'GET' -Endpoint '/client/orders' -Expected '200' -Actual $clientOrders.Status -Pass ($clientOrders.Status -eq 200)

# ------------------
# 5) Admin incidents check + cleanup
# ------------------
$adminIncidents = Invoke-Api -Method 'GET' -Url "$base/incidents" -Token $adminToken
Add-Check -Role 'admin' -Step 'List Incidents' -Method 'GET' -Endpoint '/incidents' -Expected '200' -Actual $adminIncidents.Status -Pass ($adminIncidents.Status -eq 200)

if ($incidentCreatedByTest -and $incidentDeliveryId) {
    $cleanupIncident = Invoke-Api -Method 'DELETE' -Url "$base/incidents/$incidentDeliveryId" -Token $adminToken
    Add-Check -Role 'admin' -Step 'Cleanup Incident' -Method 'DELETE' -Endpoint "/incidents/$incidentDeliveryId" -Expected '200' -Actual $cleanupIncident.Status -Pass ($cleanupIncident.Status -eq 200)
}

if ($geoStatusChanged -and $geoDeliveryId -and $geoOriginalStatus -eq 'planned') {
    $geoRestore = Invoke-Api -Method 'PATCH' -Url "$base/deliveries/$geoDeliveryId/status" -Token $chauffeurToken -BodyObject @{ status = 'planned' }
    Add-Check -Role 'chauffeur' -Step 'Restore Delivery Status (Geo)' -Method 'PATCH' -Endpoint "/deliveries/$geoDeliveryId/status" -Expected '200' -Actual $geoRestore.Status -Pass ($geoRestore.Status -eq 200)
}

# ------------------
# Output
# ------------------
$results | Sort-Object Role, Step | Format-Table Role, Step, Method, Endpoint, Expected, Actual, Pass, Note -AutoSize -Wrap

$total = $results.Count
$passed = @($results | Where-Object { $_.Pass }).Count
$failed = $total - $passed

Write-Output ""
Write-Output "SUMMARY: $passed / $total checks passed; failed: $failed"
$defaultOrderOut = if ($orderIdDefault) { $orderIdDefault } else { 'N/A' }
$customOrderOut = if ($orderIdCustom) { $orderIdCustom } else { 'N/A' }
Write-Output ("created_order_default_id=" + $defaultOrderOut)
Write-Output ("created_order_custom_id=" + $customOrderOut)

Write-Output ""
Write-Output "RESULTS_PIPE:"
$results | Sort-Object Role, Step | ForEach-Object {
    Write-Output ("{0}|{1}|{2}|{3}|{4}|{5}|{6}" -f $_.Role, $_.Step, $_.Method, $_.Endpoint, $_.Expected, $_.Actual, $_.Pass)
}

if ($failed -gt 0) {
    Write-Output ""
    Write-Output "FAILED CHECKS:"
    $results | Where-Object { -not $_.Pass } | Format-Table Role, Step, Method, Endpoint, Expected, Actual, Note -AutoSize -Wrap
}

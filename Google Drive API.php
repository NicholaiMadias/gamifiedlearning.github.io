function gulf_nexus_drive_google() {
    ?>
    <div class="gulf-console">
        <h2>Google Drive Sync</h2>
        <p>Select files or folders to auto‑generate pages or galleries.</p>

        <button id="gdrivePicker" class="gulf-btn">Open Google Drive</button>

        <script src="https://apis.google.com/js/api.js"></script>
        <script>
            function loadPicker() {
                gapi.load('picker', {'callback': createPicker});
            }

            function createPicker() {
                const picker = new google.picker.PickerBuilder()
                    .addView(google.picker.ViewId.DOCS)
                    .setOAuthToken("<?php echo get_option('gulf_nexus_google_token'); ?>")
                    .setDeveloperKey("<?php echo get_option('gulf_nexus_google_key'); ?>")
                    .setCallback(pickerCallback)
                    .build();
                picker.setVisible(true);
            }

            function pickerCallback(data) {
                if (data.action === google.picker.Action.PICKED) {
                    const fileId = data.docs[0].id;
                    fetch("<?php echo admin_url('admin-ajax.php'); ?>?action=gulf_nexus_drive_import&file=" + fileId)
                }
            }

            document.getElementById("gdrivePicker").onclick = loadPicker;
        </script>
    </div>
    <?php
}

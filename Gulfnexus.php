add_action('admin_menu', function() {
    add_submenu_page(
        'gulf-nexus-sync',
        'Drive Interface',
        'Drive Interface',
        'manage_options',
        'gulf-nexus-drive',
        'gulf_nexus_drive_interface'
    );
});

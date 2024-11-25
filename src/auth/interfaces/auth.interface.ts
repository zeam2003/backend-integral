 interface Auth {
    valid_id: string;
    glpi_currenttime: string;
    glpi_use_mode: number;
    glpiID: number;
    glpiis_ids_visible: string;
    glpifriendlyname: string;
    glpiname: string;
    glpirealname: string;
    glpifirstname: string;
    glpidefault_entity: number;
    glpiactiveprofile: GlpiActiveProfile;
}

 interface GlpiActiveProfile {
    name: string;
}

export interface ApiResponse {
    session: Auth;
    
}
    

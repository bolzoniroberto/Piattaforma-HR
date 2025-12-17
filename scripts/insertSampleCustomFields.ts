import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  try {
    console.log('📄 Inserting sample custom fields...');

    // First, check if there are any fields
    const existing = await sql`SELECT COUNT(*) FROM custom_field_definitions`;
    console.log(`Current field count: ${existing[0].count}`);

    // Get admin user ID
    const adminUsers = await sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
    const adminId = adminUsers[0]?.id;

    if (!adminId) {
      console.error('❌ No admin user found!');
      process.exit(1);
    }

    console.log(`Using admin ID: ${adminId}`);

    // Insert sample fields
    const fields = [
      {
        name: 'taglia_maglietta',
        label: 'Taglia Maglietta',
        type: 'select',
        category: 'custom',
        section: 'Altro',
        required: false,
        active: true,
        order: 1,
        placeholder: null,
        help: 'Taglia per eventi aziendali e gadget',
        options: [
          { value: 'xs', label: 'XS' },
          { value: 's', label: 'S' },
          { value: 'm', label: 'M' },
          { value: 'l', label: 'L' },
          { value: 'xl', label: 'XL' },
          { value: 'xxl', label: 'XXL' }
        ]
      },
      {
        name: 'badge_number',
        label: 'Numero Badge',
        type: 'text',
        category: 'organizational',
        section: 'Informazioni Organizzative',
        required: false,
        active: true,
        order: 2,
        placeholder: 'Es: A12345',
        help: 'Numero identificativo badge aziendale',
        options: null
      },
      {
        name: 'allergies',
        label: 'Allergie/Intolleranze',
        type: 'textarea',
        category: 'custom',
        section: 'Salute e Sicurezza',
        required: false,
        active: true,
        order: 3,
        placeholder: 'Inserisci eventuali allergie',
        help: 'Informazioni per mensa aziendale ed eventi',
        options: null
      },
      {
        name: 'linkedin_profile',
        label: 'Profilo LinkedIn',
        type: 'url',
        category: 'contact',
        section: 'Contatti',
        required: false,
        active: true,
        order: 4,
        placeholder: 'https://linkedin.com/in/...',
        help: 'Link al profilo LinkedIn',
        options: null
      },
      {
        name: 'patente_guida',
        label: 'Patente di Guida',
        type: 'select',
        category: 'personal',
        section: 'Documenti',
        required: false,
        active: true,
        order: 5,
        placeholder: null,
        help: 'Tipo di patente posseduta',
        options: [
          { value: 'a', label: 'A - Moto' },
          { value: 'b', label: 'B - Auto' },
          { value: 'c', label: 'C - Autocarri' },
          { value: 'd', label: 'D - Autobus' },
          { value: 'e', label: 'E - Rimorchi' }
        ]
      },
      {
        name: 'auto_aziendale',
        label: 'Auto Aziendale',
        type: 'boolean',
        category: 'organizational',
        section: 'Benefit',
        required: false,
        active: true,
        order: 6,
        placeholder: null,
        help: 'Indica se possiede auto aziendale',
        options: null
      },
      {
        name: 'data_scadenza_contratto',
        label: 'Scadenza Contratto',
        type: 'date',
        category: 'professional',
        section: 'Contratto',
        required: false,
        active: true,
        order: 7,
        placeholder: null,
        help: 'Data di scadenza del contratto (se a termine)',
        options: null
      }
    ];

    for (const field of fields) {
      // Check if field already exists
      const existingField = await sql`
        SELECT id FROM custom_field_definitions WHERE field_name = ${field.name}
      `;

      if (existingField.length > 0) {
        console.log(`⏭️  Skipping ${field.name} (already exists)`);
        continue;
      }

      await sql`
        INSERT INTO custom_field_definitions (
          field_name, field_label, field_type, category, section,
          is_required, is_active, display_order, placeholder, help_text,
          options, created_by
        ) VALUES (
          ${field.name},
          ${field.label},
          ${field.type},
          ${field.category},
          ${field.section},
          ${field.required},
          ${field.active},
          ${field.order},
          ${field.placeholder},
          ${field.help},
          ${field.options ? JSON.stringify(field.options) : null},
          ${adminId}
        )
      `;

      console.log(`✅ Inserted ${field.name}`);
    }

    console.log('\n✅ Sample custom fields inserted successfully!');

    // Verify
    const allFields = await sql`
      SELECT id, field_name, field_label, field_type, is_active
      FROM custom_field_definitions
      ORDER BY display_order
    `;
    console.log('\n📊 Custom fields in database:');
    console.table(allFields);

  } catch (error) {
    console.error('❌ Failed to insert sample fields:', error);
    process.exit(1);
  }
}

main();

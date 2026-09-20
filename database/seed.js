import pg from 'pg';
import argon2 from 'argon2';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || 'postgresql://betoch_admin@localhost:5433/betoch_dev';
const client = new pg.Client({ connectionString: databaseUrl });

async function seedDatabase() {
  try {
    await client.connect();
    console.log('[DB Seed] Connected to database.');

    await client.query('BEGIN');

    // 1. Seed Amenities
    const amenities = [
      { id: 'water_tank', name: 'Backup Water Tank', category: 'Utilities', icon: 'droplet' },
      { id: 'generator', name: 'Backup Generator', category: 'Utilities', icon: 'zap' },
      { id: 'wifi', name: 'High-Speed Internet / WiFi', category: 'Utilities', icon: 'wifi' },
      { id: 'parking', name: 'Reserved Parking Space', category: 'Building', icon: 'car' },
      { id: 'elevator', name: 'Elevator / Lift', category: 'Building', icon: 'arrow-up-down' },
      { id: 'security_guard', name: '24/7 Security Guard', category: 'Security', icon: 'shield-check' },
      { id: 'cctv', name: 'CCTV Surveillance', category: 'Security', icon: 'video' },
      { id: 'balcony', name: 'Private Balcony', category: 'Living', icon: 'sun' },
      { id: 'modern_kitchen', name: 'Modern Fitted Kitchen', category: 'Interior', icon: 'utensils' },
      { id: 'water_heater', name: 'Water Heater / Boiler', category: 'Utilities', icon: 'flame' },
      { id: 'washing_machine', name: 'Washing Machine Area', category: 'Interior', icon: 'layers' },
      { id: 'pets_allowed', name: 'Pets Allowed', category: 'Rules', icon: 'heart' }
    ];

    for (const a of amenities) {
      await client.query(`
        INSERT INTO amenities (id, name, category, icon)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category, icon = EXCLUDED.icon
      `, [a.id, a.name, a.category, a.icon]);
    }
    console.log('[DB Seed] Seeded amenities.');

    // 2. Create Default Test Users with Argon2id
    const defaultPassword = 'Password123!';
    const passwordHash = await argon2.hash(defaultPassword, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2
    });

    // Admin User
    const adminRes = await client.query(`
      INSERT INTO users (email, phone, password_hash, role, is_active, email_verified, phone_verified)
      VALUES ('admin@betoch.et', '+251911000001', $1, 'ADMIN', true, true, true)
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id;
    `, [passwordHash]);
    const adminId = adminRes.rows[0].id;

    await client.query(`
      INSERT INTO user_profiles (user_id, first_name, last_name, bio, identity_status)
      VALUES ($1, 'Abebe', 'Kebede', 'Senior Trust & Safety Administrator at Betoch Marketplace.', 'VERIFIED')
      ON CONFLICT (user_id) DO UPDATE SET identity_status = 'VERIFIED';
    `, [adminId]);

    // Verified Owner User
    const ownerRes = await client.query(`
      INSERT INTO users (email, phone, password_hash, role, is_active, email_verified, phone_verified)
      VALUES ('owner@betoch.et', '+251911223344', $1, 'OWNER', true, true, true)
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id;
    `, [passwordHash]);
    const ownerId = ownerRes.rows[0].id;

    await client.query(`
      INSERT INTO user_profiles (user_id, first_name, last_name, bio, identity_status)
      VALUES ($1, 'Desta', 'Tadesse', 'Licensed residential property owner in Bole and Kirkos sub-cities. Providing modern, verified living spaces.', 'VERIFIED')
      ON CONFLICT (user_id) DO UPDATE SET identity_status = 'VERIFIED';
    `, [ownerId]);

    // Add Fayda Digital ID verification record for owner
    const faydaHash = crypto.createHash('sha256').update('ET-FIN-9823-4512-7801').digest('hex');
    await client.query(`
      INSERT INTO identity_verifications (user_id, id_type, id_number_hash, id_number_masked, document_front_url, status, reviewed_by, reviewed_at)
      VALUES ($1, 'FAYDA_DIGITAL_ID', $2, 'FIN-••••-7801', '/uploads/verifications/sample_fayda_front.jpg', 'APPROVED', $3, NOW())
      ON CONFLICT DO NOTHING;
    `, [ownerId, faydaHash, adminId]);

    // Verified Renter User
    const renterRes = await client.query(`
      INSERT INTO users (email, phone, password_hash, role, is_active, email_verified, phone_verified)
      VALUES ('renter@betoch.et', '+251922334455', $1, 'RENTER', true, true, true)
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id;
    `, [passwordHash]);
    const renterId = renterRes.rows[0].id;

    await client.query(`
      INSERT INTO user_profiles (user_id, first_name, last_name, bio, identity_status)
      VALUES ($1, 'Ezra', 'Haile', 'Software Engineer & Research Fellow looking for quiet residential spaces in Addis Ababa.', 'VERIFIED')
      ON CONFLICT (user_id) DO UPDATE SET identity_status = 'VERIFIED';
    `, [renterId]);

    console.log('[DB Seed] Seeded users (admin, verified owner, verified renter). Password: Password123!');

    // 3. Seed Properties
    const propertiesData = [
      {
        title: 'Luxury 3-Bedroom Apartment in Bole Atlas',
        slug: 'luxury-3-bedroom-apartment-bole-atlas',
        description: 'Impeccably finished modern 3-bedroom apartment located in prime Bole Atlas. Features spacious living room with large glass windows, fully equipped modern kitchen, backup generator, high-speed elevator, 24/7 security guard, and covered parking. Close to international schools, embassies, and major dining avenues.',
        property_type: 'APARTMENT',
        bedrooms: 3,
        bathrooms: 2.5,
        floor: 4,
        total_floors: 8,
        size_sqm: 165.0,
        furnished: true,
        country: 'Ethiopia',
        city: 'Addis Ababa',
        sub_city: 'Bole',
        woreda: '03',
        neighborhood: 'Bole Atlas',
        latitude_approx: 9.0062,
        longitude_approx: 38.7845,
        monthly_rent: 45000.0,
        deposit_amount: 90000.0, // 2 months rent max
        currency: 'ETB',
        lease_duration_months: 12,
        available_from: '2026-10-01',
        utilities_included: ['Water', 'Garbage Collection', 'Building Security', 'Elevator Maintenance'],
        verification_status: 'VERIFIED',
        listing_status: 'PUBLISHED',
        images: [
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80'
        ],
        amenities: ['generator', 'water_tank', 'elevator', 'security_guard', 'cctv', 'modern_kitchen', 'water_heater', 'parking', 'balcony', 'wifi']
      },
      {
        title: 'Modern 2-Bedroom Apartment in Kazanchis',
        slug: 'modern-2-bedroom-apartment-kazanchis',
        description: 'Bright and executive 2-bedroom apartment situated in the diplomatic heart of Kazanchis, walking distance to UNECA and luxury hotels. Offers contemporary furnishings, fiber internet hookup, steady backup water system, automatic generator, and dedicated basement parking space.',
        property_type: 'APARTMENT',
        bedrooms: 2,
        bathrooms: 2.0,
        floor: 3,
        total_floors: 6,
        size_sqm: 110.0,
        furnished: true,
        country: 'Ethiopia',
        city: 'Addis Ababa',
        sub_city: 'Kirkos',
        woreda: '08',
        neighborhood: 'Kazanchis',
        latitude_approx: 9.0185,
        longitude_approx: 38.7650,
        monthly_rent: 32000.0,
        deposit_amount: 64000.0,
        currency: 'ETB',
        lease_duration_months: 12,
        available_from: '2026-10-05',
        utilities_included: ['Water', 'Security', 'Trash'],
        verification_status: 'VERIFIED',
        listing_status: 'PUBLISHED',
        images: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80'
        ],
        amenities: ['generator', 'water_tank', 'elevator', 'wifi', 'parking', 'security_guard', 'modern_kitchen']
      },
      {
        title: 'Prestigious 4-Bedroom Villa in Old Airport',
        slug: 'prestigious-4-bedroom-villa-old-airport',
        description: 'Standalone diplomatic standard villa with lush private landscaped garden, guard house, staff quarters, and multi-vehicle driveway. High-security perimeter wall with electric fence and CCTV. Located in a tranquil, prestigious enclave of Old Airport / Sarbet.',
        property_type: 'VILLA',
        bedrooms: 4,
        bathrooms: 3.5,
        floor: 0,
        total_floors: 2,
        size_sqm: 420.0,
        furnished: false,
        country: 'Ethiopia',
        city: 'Addis Ababa',
        sub_city: 'Nifas Silk-Lafto',
        woreda: '05',
        neighborhood: 'Sarbet',
        latitude_approx: 8.9892,
        longitude_approx: 38.7351,
        monthly_rent: 85000.0,
        deposit_amount: 170000.0,
        currency: 'ETB',
        lease_duration_months: 24,
        available_from: '2026-11-01',
        utilities_included: ['Gardener Service'],
        verification_status: 'VERIFIED',
        listing_status: 'PUBLISHED',
        images: [
          'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80'
        ],
        amenities: ['generator', 'water_tank', 'security_guard', 'cctv', 'parking', 'pets_allowed', 'water_heater']
      },
      {
        title: 'Cozy Sunlit Studio in CMC / Yeka',
        slug: 'cozy-sunlit-studio-cmc-yeka',
        description: 'Efficient and well-lit studio apartment ideal for single professionals or graduate students. Situated in a safe, gated community in CMC near the Light Rail transit station. Includes kitchenette, hot shower, backup water tank, and 24/7 security.',
        property_type: 'STUDIO',
        bedrooms: 1,
        bathrooms: 1.0,
        floor: 2,
        total_floors: 5,
        size_sqm: 48.0,
        furnished: true,
        country: 'Ethiopia',
        city: 'Addis Ababa',
        sub_city: 'Yeka',
        woreda: '10',
        neighborhood: 'CMC',
        latitude_approx: 9.0298,
        longitude_approx: 38.8310,
        monthly_rent: 18000.0,
        deposit_amount: 36000.0,
        currency: 'ETB',
        lease_duration_months: 12,
        available_from: '2026-09-25',
        utilities_included: ['Water', 'Compound Security'],
        verification_status: 'VERIFIED',
        listing_status: 'PUBLISHED',
        images: [
          'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80'
        ],
        amenities: ['water_tank', 'wifi', 'parking', 'security_guard', 'water_heater']
      },
      {
        title: 'Spacious 3-Bedroom Condominium in Summit',
        slug: 'spacious-3-bedroom-condominium-summit',
        description: 'Well-maintained 3-bedroom condominium apartment on 2nd floor in Summit Safari area. Peaceful community, abundant natural light, ceramic tiled flooring throughout, private balcony overlooking green common courtyard, and reliable water supply.',
        property_type: 'CONDOMINIUM',
        bedrooms: 3,
        bathrooms: 2.0,
        floor: 2,
        total_floors: 4,
        size_sqm: 105.0,
        furnished: false,
        country: 'Ethiopia',
        city: 'Addis Ababa',
        sub_city: 'Lemi Kura',
        woreda: '04',
        neighborhood: 'Summit',
        latitude_approx: 9.0175,
        longitude_approx: 38.8650,
        monthly_rent: 22000.0,
        deposit_amount: 44000.0,
        currency: 'ETB',
        lease_duration_months: 12,
        available_from: '2026-10-15',
        utilities_included: ['Site Security'],
        verification_status: 'VERIFIED',
        listing_status: 'PUBLISHED',
        images: [
          'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1200&q=80'
        ],
        amenities: ['water_tank', 'parking', 'balcony', 'security_guard']
      },
      {
        title: 'Elegant 2-Bedroom Residence in Bisrate Gabriel',
        slug: 'elegant-2-bedroom-residence-bisrate-gabriel',
        description: 'Tastefully furnished apartment in prime Bisrate Gabriel with close proximity to Lafto Mall, international cafes, and fitness centers. Features modern Italian-style kitchen, automated water pressure pump, generator for building amenities, and round-the-clock concierge.',
        property_type: 'APARTMENT',
        bedrooms: 2,
        bathrooms: 2.0,
        floor: 5,
        total_floors: 7,
        size_sqm: 125.0,
        furnished: true,
        country: 'Ethiopia',
        city: 'Addis Ababa',
        sub_city: 'Nifas Silk-Lafto',
        woreda: '03',
        neighborhood: 'Bisrate Gabriel',
        latitude_approx: 8.9830,
        longitude_approx: 38.7420,
        monthly_rent: 38000.0,
        deposit_amount: 76000.0,
        currency: 'ETB',
        lease_duration_months: 12,
        available_from: '2026-10-10',
        utilities_included: ['Water', 'Elevator', 'Security'],
        verification_status: 'VERIFIED',
        listing_status: 'PUBLISHED',
        images: [
          'https://images.unsplash.com/photo-1502005229762-ee152da92e06?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=1200&q=80'
        ],
        amenities: ['generator', 'water_tank', 'elevator', 'wifi', 'parking', 'security_guard', 'modern_kitchen', 'cctv']
      }
    ];

    const propertyIds = [];

    for (const p of propertiesData) {
      const propRes = await client.query(`
        INSERT INTO properties (
          owner_id, title, slug, description, property_type, bedrooms, bathrooms, floor, total_floors,
          size_sqm, furnished, country, city, sub_city, woreda, neighborhood, latitude_approx, longitude_approx,
          monthly_rent, deposit_amount, currency, lease_duration_months, available_from, utilities_included,
          verification_status, listing_status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23, $24,
          $25, $26
        )
        ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, monthly_rent = EXCLUDED.monthly_rent
        RETURNING id;
      `, [
        ownerId, p.title, p.slug, p.description, p.property_type, p.bedrooms, p.bathrooms, p.floor, p.total_floors,
        p.size_sqm, p.furnished, p.country, p.city, p.sub_city, p.woreda, p.neighborhood, p.latitude_approx, p.longitude_approx,
        p.monthly_rent, p.deposit_amount, p.currency, p.lease_duration_months, p.available_from, p.utilities_included,
        p.verification_status, p.listing_status
      ]);

      const propId = propRes.rows[0].id;
      propertyIds.push(propId);

      // Clean old images and amenities for idempotency
      await client.query('DELETE FROM property_images WHERE property_id = $1', [propId]);
      await client.query('DELETE FROM property_amenities WHERE property_id = $1', [propId]);

      // Insert images
      for (let i = 0; i < p.images.length; i++) {
        await client.query(`
          INSERT INTO property_images (property_id, image_url, is_primary, display_order)
          VALUES ($1, $2, $3, $4)
        `, [propId, p.images[i], i === 0, i]);
      }

      // Insert amenities
      for (const aId of p.amenities) {
        await client.query(`
          INSERT INTO property_amenities (property_id, amenity_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING;
        `, [propId, aId]);
      }
    }

    console.log(`[DB Seed] Seeded ${propertiesData.length} verified listings across Addis Ababa.`);

    // 4. Seed a Sample Rental Application, Contract, Commission, and Payment
    const samplePropertyId = propertyIds[0]; // Bole Atlas property

    const appRes = await client.query(`
      INSERT INTO rental_applications (
        property_id, renter_id, proposed_start_date, occupants_count, message, status
      ) VALUES (
        $1, $2, '2026-10-01', 2,
        'Hello Desta, my wife and I are professionals moving to Bole Atlas. We love the apartment and would like to sign a 1-year lease.',
        'ACCEPTED'
      )
      RETURNING id;
    `, [samplePropertyId, renterId]);
    const appId = appRes.rows[0].id;

    const contractRes = await client.query(`
      INSERT INTO rental_contracts (
        property_id, renter_id, owner_id, application_id, start_date, end_date,
        monthly_rent, deposit_amount, government_registration_no, status
      ) VALUES (
        $1, $2, $3, $4, '2026-10-01', '2027-09-30',
        45000.0, 90000.0, 'AA-BOLE-REG-2026-8819', 'ACTIVE'
      )
      RETURNING id;
    `, [samplePropertyId, renterId, ownerId, appId]);
    const contractId = contractRes.rows[0].id;

    // Platform Commission (10% of 1 month rent = 4,500 ETB)
    const commRes = await client.query(`
      INSERT INTO commissions (
        contract_id, owner_id, rental_amount, commission_rate_percent, commission_amount,
        currency, rule_name, status
      ) VALUES (
        $1, $2, 45000.0, 10.0, 4500.0,
        'ETB', 'STANDARD_TENANT_FINDER_2026', 'PAID'
      )
      RETURNING id;
    `, [contractId, ownerId]);
    const commId = commRes.rows[0].id;

    // Payment Record (Telebirr)
    const outTradeNo = 'TXN-TB-' + Date.now();
    await client.query(`
      INSERT INTO payments (
        contract_id, commission_id, payer_id, provider, transaction_reference,
        out_trade_no, amount, currency, payment_type, status, raw_callback_payload
      ) VALUES (
        $1, $2, $3, 'TELEBIRR', $4,
        $4, 4500.0, 'ETB', 'COMMISSION', 'COMPLETED',
        '{"gateway": "telebirr", "msisdn": "251911223344", "status": "SUCCESS"}'::jsonb
      );
    `, [contractId, commId, ownerId, outTradeNo]);

    // Add Audit Log
    await client.query(`
      INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, metadata)
      VALUES ($1, 'RENTAL_CONTRACT_COMPLETED', 'rental_contracts', $2, '{"commission_amount": 4500, "currency": "ETB"}'::jsonb);
    `, [adminId, contractId]);

    // Add Notification for renter
    await client.query(`
      INSERT INTO notifications (user_id, title, message, type, link_url)
      VALUES ($1, 'Application Approved!', 'Your rental application for Luxury 3-Bedroom Apartment in Bole Atlas was accepted by the owner.', 'APPLICATION_ACCEPTED', '/rentals');
    `, [renterId]);

    // Add Review
    await client.query(`
      INSERT INTO reviews (
        contract_id, property_id, author_id, recipient_id, rating_accuracy, rating_communication, rating_overall, comment
      ) VALUES (
        $1, $2, $3, $4, 5, 5, 5,
        'Outstanding property! The owner Desta is thoroughly professional, and the backup water tank and generator run seamlessly during city maintenance.'
      )
      ON CONFLICT DO NOTHING;
    `, [contractId, samplePropertyId, renterId, ownerId]);

    await client.query('COMMIT');
    console.log('[DB Seed] Successfully completed database seeding with realistic marketplace data.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[DB Seed] Seeding error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedDatabase();

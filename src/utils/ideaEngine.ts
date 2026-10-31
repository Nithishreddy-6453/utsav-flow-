/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PersonalizedIdea } from '../types/plan.ts';
import type { EventDraft } from '../types.ts';

// Curated image assets available in workspace
const CATEGORY_IMAGE_MAP: Record<string, string[]> = {
  Decor: [
    '/assets/aistudio/Image_11_7199844f.jpeg',
    '/assets/aistudio/Image_15_7faa1bf8.png',
    '/assets/aistudio/Image_3_89127dcf.jpeg'
  ],
  Food: [
    '/assets/aistudio/Image_13_e2c735c7.png',
    '/assets/aistudio/Image_7_760eb13d.jpeg',
    '/assets/aistudio/Image_9_5728ac4e.png'
  ],
  Activities: [
    '/assets/aistudio/Image_17_65ba33e0.png',
    '/assets/aistudio/Image_21_a46c70b3.png',
    '/assets/aistudio/Image_25_ff529cf3.png'
  ],
  'Guest Comfort': [
    '/assets/aistudio/Image_19_650648e5.jpeg',
    '/assets/aistudio/Image_23_5788ebec.png',
    '/assets/aistudio/Image_1_8a8aa21a.png'
  ]
};

function getCategoryImage(category: string, index: number): string {
  const images = CATEGORY_IMAGE_MAP[category] || CATEGORY_IMAGE_MAP['Decor'];
  return images[index % images.length] || '/assets/aistudio/Image_11_7199844f.jpeg';
}

/**
 * Generates personalized event ideas grounded strictly in the saved draft constraints.
 * Pure function: does NOT mutate saved plan state.
 */
export function generateDeterministicIdeas(draft: EventDraft): PersonalizedIdea[] {
  const priorities = draft.priorities || [];
  const mustHaves = draft.mustHaves || [];
  const accessibility = draft.accessibilityRequirements || '';
  const thingsToAvoid = draft.thingsToAvoid || '';
  const guests = draft.totalGuests || 150;
  const budget = draft.maxBudget || 1000000;
  const style = draft.eventStyle?.join(', ') || 'Traditional Heritage';

  const ideas: PersonalizedIdea[] = [];
  const now = new Date().toISOString();

  // 1. DECOR: Tailored to style and things to avoid
  const avoidPlastic = thingsToAvoid.toLowerCase().includes('plastic');
  const isBudgetSensitive = draft.budgetFlexibility === 'strict' || budget <= 800000;

  ideas.push({
    id: 'idea_decor_1',
    title: 'Brass Diya & Saffron Marigold Heritage Canopy',
    category: 'Decor',
    description: `A breathtaking architectural floral mandap combining marigold swags, hammered bell brass urns, and warm fairy light drapes tailored to ${draft.eventLocation || 'your venue'}.`,
    whyItFits: `Complements your ${style} theme with zero synthetic materials${avoidPlastic ? ' and complies strictly with your zero-plastic preference' : ''}.`,
    practicalConsiderations: [
      'Locally sourced marigolds and jasmine reduce transport footprint by 40%',
      'Requires 3-hour morning setup window before guest arrival',
      'Flame-free LED tea lights inside brass lamps for fire safety'
    ],
    mustHaveCompatibility: mustHaves.length > 0 ? `Accommodates your essential must-haves: "${mustHaves.slice(0, 2).join(', ')}"` : 'Designed around focal celebration space',
    potentialConflicts: thingsToAvoid ? `Verified compliant with exclusions: avoids "${thingsToAvoid}"` : 'No conflicts identified',
    budgetImpact: isBudgetSensitive ? 'Likely low impact' : 'Potentially moderate impact',
    budgetAssumptions: 'Uses local seasonal marigolds and reusable brass hardware instead of imported flora.',
    tags: [
      priorities.some(p => p.toLowerCase().includes('decor')) ? '★ Priority Match: Decor' : 'High Visual Impact',
      'Low Waste',
      'Photo Focal Point'
    ],
    image: getCategoryImage('Decor', 0),
    source: 'rule_based',
    createdAt: now,
    updatedAt: now
  });

  // 2. FOOD: Tailored to guests and food priority
  const hasFoodPriority = priorities.some(p => p.toLowerCase().includes('catering') || p.toLowerCase().includes('food'));
  ideas.push({
    id: 'idea_food_1',
    title: 'Artisanal Live Chaat Bazaar & Regional Mithai Tasting',
    category: 'Food',
    description: `Interactive live culinary counters featuring regional street specialties, custom seasoning bars, and hot jalebis paired with slow-simmered rabri for ${guests} guests.`,
    whyItFits: hasFoodPriority 
      ? `Specifically caters to your #1 priority (${priorities[0]}) by elevating guest culinary memory.`
      : `High-delight food station creating natural mingling for ${guests} guests.`,
    practicalConsiderations: [
      'Requires 4 live counter chefs and 2 dedicated bus staff',
      'Separate mild counter prepared for children and senior guests',
      'Biodegradable sal leaf and terracotta bowl presentation'
    ],
    mustHaveCompatibility: `Can accommodate customized dietary preferences: "${draft.culturalPreferences || 'Regional specialties'}"`,
    potentialConflicts: thingsToAvoid ? `Excludes restricted items: avoids "${thingsToAvoid}"` : undefined,
    budgetImpact: 'Potentially moderate impact',
    budgetAssumptions: `Estimated at ₹250–₹350 per guest over standard buffet, assuming 4 live stations for ${guests} guests.`,
    tags: [
      hasFoodPriority ? '★ Priority Match: Food' : 'Guest Crowd Pleaser',
      'Interactive Dining',
      'Regional Heritage'
    ],
    image: getCategoryImage('Food', 0),
    source: 'rule_based',
    createdAt: now,
    updatedAt: now
  });

  // 3. GUEST COMFORT: Specially crafted for accessibility requirements
  const hasAccessibility = Boolean(accessibility && accessibility.trim().length > 0);
  ideas.push({
    id: 'idea_comfort_1',
    title: 'Low-Fatigue Heritage Lounge with Priority Care Valet',
    category: 'Guest Comfort',
    description: `A dedicated shaded relaxation sanctuary adjacent to the main celebration area with cushioned cane diwans, hydration station, and direct step-free access.`,
    whyItFits: hasAccessibility
      ? `Directly fulfills your accessibility requirements: "${accessibility}". Keeps elders and fatigued guests connected without noise distress.`
      : `Provides a serene retreat for multi-generational guests during long celebration ceremonies.`,
    practicalConsiderations: [
      'Positioned within clear line-of-sight of the ceremony but buffered from speaker acoustic spill',
      'Zero-threshold ramp flooring with 1:12 gradient for wheelchair accessibility',
      'Dedicated attendants serving hot beverages and water directly to seated guests'
    ],
    mustHaveCompatibility: hasAccessibility ? `Directly addresses requirement: ${accessibility}` : 'Multi-generational comfort',
    potentialConflicts: thingsToAvoid ? `Keeps clear of: ${thingsToAvoid}` : undefined,
    budgetImpact: 'Likely low impact',
    budgetAssumptions: 'Utilizes venue lounge furniture clusters supplemented with soft floor bolsters.',
    tags: [
      hasAccessibility ? '★ Accessibility Aligned' : 'Elder Friendly',
      'Noise Buffer',
      'High Thoughtfulness'
    ],
    image: getCategoryImage('Guest Comfort', 0),
    source: 'rule_based',
    createdAt: now,
    updatedAt: now
  });

  // 4. ACTIVITIES: Tailored to celebration style
  ideas.push({
    id: 'idea_act_1',
    title: 'Family Storytelling Video Booth & Memory Ledger',
    category: 'Activities',
    description: `An intimate retro-styled recording corner with soft vintage studio lighting where family and guests record 30-second celebratory blessings and sign a linen-bound scrapbook.`,
    whyItFits: `Captures authentic, unscripted heartfelt moments across generations without disrupting program timeline.`,
    practicalConsiderations: [
      'Simple iPad or compact camera setup on tripod with omni-directional lavalier microphone',
      'Operated by a designated cousin or assistant photographer during cocktail reception',
      'Instant digital backup to cloud drive'
    ],
    mustHaveCompatibility: 'Complements photography and videography deliverables',
    potentialConflicts: undefined,
    budgetImpact: 'Likely low impact',
    budgetAssumptions: 'Can be managed by the photography team with minimal extra equipment rental.',
    tags: [
      'Keepsake Memory',
      'Low Cost',
      'Multi-Generational'
    ],
    image: getCategoryImage('Activities', 0),
    source: 'rule_based',
    createdAt: now,
    updatedAt: now
  });

  // 5. DECOR / SUSTAINABILITY: Candlelight & Potted Greens
  ideas.push({
    id: 'idea_decor_2',
    title: 'Living Potted Greens & Terracotta Candle Pathway',
    category: 'Decor',
    description: `Illuminated pathway featuring living potted ferns, flowering jasmine shrubs in terracotta pots, and flickering glass hurricane lanterns.`,
    whyItFits: `Zero cut-flower wilt, sustainable takeaway gifts for key relatives, and reusable components.`,
    practicalConsiderations: [
      'Plants can be rented from local nursery or gifted to guests post-event',
      'Wind-resistant glass hurricanes protect candles from outdoor breezes',
      'Clean step-free installation along main entry walkways'
    ],
    mustHaveCompatibility: mustHaves.length > 0 ? `Coordinates with: ${mustHaves[0]}` : 'Sustainable visual path',
    potentialConflicts: avoidPlastic ? '100% natural earthenware and glass' : undefined,
    budgetImpact: 'Likely low impact',
    budgetAssumptions: 'Nursery plant rentals typically cost 60% less than cut floral installations.',
    tags: [
      'Eco-Friendly',
      'Take-Home Keepsake',
      'Budget Efficient'
    ],
    image: getCategoryImage('Decor', 1),
    source: 'rule_based',
    createdAt: now,
    updatedAt: now
  });

  // 6. FOOD / BEVERAGE: Artisanal Chai & Sharbat Bar
  ideas.push({
    id: 'idea_food_2',
    title: 'Heirloom Kahwa & Slow-Brewed Masala Chai Station',
    category: 'Food',
    description: `Traditional samovar tea station brewing Kashmiri saffron kahwa with slivered almonds alongside hot ginger-cardamom cutting chai in earthen kullhads.`,
    whyItFits: `Warm comfort ritual highly appreciated by guests during evening ceremonies and post-dinner gatherings.`,
    practicalConsiderations: [
      'Requires single electrical or gas point with safe barricading',
      'Served in biodegradable terracotta kullhads (supports local potters)',
      'Offers sugar-free and non-dairy almond milk options'
    ],
    mustHaveCompatibility: accessibility ? 'Offers seated counter service for elders' : 'Universal crowd pleaser',
    potentialConflicts: avoidPlastic ? 'Zero single-use plastic cups' : undefined,
    budgetImpact: 'Likely low impact',
    budgetAssumptions: 'Very high perceived guest value for low ingredient cost (approx ₹40–₹60 per serving).',
    tags: [
      'Warm Hospitality',
      'Zero Plastic',
      'Low Cost High Delight'
    ],
    image: getCategoryImage('Food', 1),
    source: 'rule_based',
    createdAt: now,
    updatedAt: now
  });

  return ideas;
}

/**
 * Natural language refinement engine: produces 2-3 tailored alternatives based on prompt.
 * Pure function: does NOT mutate saved plan state.
 */
export function refineIdeaDeterministically(
  refinementPrompt: string,
  draft: EventDraft,
  baseIdea?: PersonalizedIdea
): PersonalizedIdea[] {
  const p = refinementPrompt.toLowerCase();
  const now = new Date().toISOString();
  const baseCategory = baseIdea?.category || 'Decor';

  const alternatives: PersonalizedIdea[] = [];

  if (p.includes('budget') || p.includes('cheap') || p.includes('cost') || p.includes('afford') || p.includes('simple')) {
    alternatives.push({
      id: `idea_ref_${Date.now()}_1`,
      title: 'Minimalist Brass & Earthen Candle Accentuation',
      category: baseCategory,
      description: `Streamlined concept replacing expensive floral installations with warm ambient lighting, terracotta oil lamps, and handwoven dupattas.`,
      whyItFits: `Honors your request for a simpler, budget-conscious setup while preserving the dignified traditional aesthetic.`,
      practicalConsiderations: [
        'Saves up to 65% compared to heavy floral framing',
        'Quick 1-hour setup and effortless breakdown',
        'Reusable components with zero floral disposal fees'
      ],
      mustHaveCompatibility: 'Retains clean focus on main ceremonial platform',
      potentialConflicts: 'None — clean and non-cluttered',
      budgetImpact: 'Likely low impact',
      budgetAssumptions: 'Requires only local earthen lamps and fabric draping rentals.',
      tags: ['Budget Streamlined', 'Minimalist Elegance', 'Zero Waste'],
      image: getCategoryImage(baseCategory, 1),
      isRefined: true,
      source: 'user_refined',
      createdAt: now,
      updatedAt: now
    });

    alternatives.push({
      id: `idea_ref_${Date.now()}_2`,
      title: 'Potted Herb & Flowering Nursery Rental Clusters',
      category: baseCategory,
      description: `Rented lush potted bougainvillea and jasmine shrubs grouped around entryways and stage corners with warm spotlighting.`,
      whyItFits: `Delivers rich botanical presence at a fraction of cut-flower rates, supporting eco-friendly celebration principles.`,
      practicalConsiderations: [
        'Local nursery delivers, stages, and collects plants directly',
        'No cut stem wilting during warm afternoon celebrations',
        'Can be gifted to close family members as enduring wedding favors'
      ],
      budgetImpact: 'Likely low impact',
      budgetAssumptions: 'Potted rentals are approximately ₹150–₹250 per pot vs ₹2,500+ for floral arrangements.',
      tags: ['Eco Conscious', 'Sustainable Cost', 'Lush Greenery'],
      image: getCategoryImage(baseCategory, 2),
      isRefined: true,
      source: 'user_refined',
      createdAt: now,
      updatedAt: now
    });
  } else if (p.includes('elder') || p.includes('senior') || p.includes('access') || p.includes('comfort') || p.includes('wheelchair')) {
    alternatives.push({
      id: `idea_ref_${Date.now()}_1`,
      title: 'Accessible Front-Row Sanctuary with Seated Chai Service',
      category: 'Guest Comfort',
      description: `Dedicated front-row comfort zone with plush orthopedic-support armchairs, direct sightlines to the stage, and roaming hospitality attendants.`,
      whyItFits: `Directly honors your focus on elder hospitality and accessibility without segregating seniors from the central action.`,
      practicalConsiderations: [
        'Wide 4-foot aisles allowing effortless wheelchair or walker navigation',
        'Beverages, snacks, and meals served directly by dedicated attendants to eliminate buffet queue standing',
        'Located near clean ground-floor accessible restrooms'
      ],
      mustHaveCompatibility: `Directly satisfies requirement: ${draft.accessibilityRequirements || 'Senior guest comfort'}`,
      budgetImpact: 'Likely low impact',
      budgetAssumptions: 'Requires dedicated hospitality staff allocation and prioritized furniture placement.',
      tags: ['★ Accessibility Priority', 'Zero Standing Fatigue', 'Reverent Hospitality'],
      image: getCategoryImage('Guest Comfort', 0),
      isRefined: true,
      source: 'user_refined',
      createdAt: now,
      updatedAt: now
    });

    alternatives.push({
      id: `idea_ref_${Date.now()}_2`,
      title: 'Acoustically Gentle Garden Gazebo & Mild Menu Bar',
      category: 'Guest Comfort',
      description: `A quiet side terrace where conversations flow naturally without competing with speakers, featuring warm herbal teas and mild savory snacks.`,
      whyItFits: `Provides relief from sound fatigue while keeping grandparents comfortably immersed in the festivities.`,
      practicalConsiderations: [
        'Equipped with quiet ceiling fans or misting coolers depending on weather',
        'Low ambient volume cap with acoustic greenery dividers',
        'Comfortable sofa seating with firm cushions for easy standing'
      ],
      budgetImpact: 'Likely low impact',
      budgetAssumptions: 'Utilizes venue side garden space with standard banquet sofa sets.',
      tags: ['Acoustic Sanctuary', 'Mild Cuisine', 'Intergenerational'],
      image: getCategoryImage('Guest Comfort', 1),
      isRefined: true,
      source: 'user_refined',
      createdAt: now,
      updatedAt: now
    });
  } else if (p.includes('food') || p.includes('cater') || p.includes('chaat') || p.includes('sweet') || p.includes('drink')) {
    alternatives.push({
      id: `idea_ref_${Date.now()}_1`,
      title: 'Curated Regional Degustation & Street Food Alley',
      category: 'Food',
      description: `Focused culinary experience with 5 chef-curated signature regional tasting plates instead of an overwhelming 40-dish cold buffet.`,
      whyItFits: `Maximizes food quality and freshness by concentrating kitchen resources on hot, freshly assembled delicacies.`,
      practicalConsiderations: [
        'Food cooked in micro-batches directly in front of guests for maximum aroma and temperature',
        'Reduces food preparation waste by 35% compared to large static buffet trays',
        'Custom menu cards explaining the family heritage origin of each recipe'
      ],
      mustHaveCompatibility: 'Elevates food satisfaction as top celebration priority',
      budgetImpact: 'Potentially moderate impact',
      budgetAssumptions: 'Reallocates buffet budget to skilled live-station cooks with neutral net cost.',
      tags: ['Chef Curated', 'High Freshness', 'Minimal Waste'],
      image: getCategoryImage('Food', 0),
      isRefined: true,
      source: 'user_refined',
      createdAt: now,
      updatedAt: now
    });

    alternatives.push({
      id: `idea_ref_${Date.now()}_2`,
      title: 'Artisanal Sharbat & Cold-Pressed Beverage Cart',
      category: 'Food',
      description: `Vintage hand-painted wooden cart serving chilled rose khus, saffron thandai, and spiced kokum coolers in frosted earthen glasses.`,
      whyItFits: `Instant welcome delight that keeps guests hydrated without reliance on commercial packaged sodas or plastic bottles.`,
      practicalConsiderations: [
        'Refreshing welcome beverage for afternoon outdoor arrivals',
        'Zero plastic waste with reusable glass tumblers or terracotta cups',
        'Very fast throughput serving 150 guests in under 20 minutes'
      ],
      budgetImpact: 'Likely low impact',
      budgetAssumptions: 'High delight factor at nominal ingredient cost (approx ₹35–₹50 per guest).',
      tags: ['Welcome Refreshment', 'Zero Plastic', 'Heritage Beverages'],
      image: getCategoryImage('Food', 1),
      isRefined: true,
      source: 'user_refined',
      createdAt: now,
      updatedAt: now
    });
  } else {
    // General refinement matching user custom prompt
    alternatives.push({
      id: `idea_ref_${Date.now()}_1`,
      title: `Tailored ${baseIdea?.title || 'Concept'} (Refined Edition)`,
      category: baseCategory,
      description: `Custom adaptation based on: "${refinementPrompt}". Balanced to harmonize with ${draft.eventName || 'your celebration'} constraints.`,
      whyItFits: `Specifically shaped by your direction: "${refinementPrompt}".`,
      practicalConsiderations: [
        'Maintains alignment with your guest count and timeline',
        'Does not add unverified vendor dependencies',
        'Can be executed within existing category allocations'
      ],
      mustHaveCompatibility: draft.mustHaves?.length ? `Respects must-haves: ${draft.mustHaves.join(', ')}` : undefined,
      potentialConflicts: draft.thingsToAvoid ? `Vetted against exclusions: ${draft.thingsToAvoid}` : undefined,
      budgetImpact: 'Potentially moderate impact',
      budgetAssumptions: 'Designed to fit within current planned budget limits.',
      tags: ['Custom Refined', 'Personalized', 'Constraint Safe'],
      image: baseIdea?.image || getCategoryImage(baseCategory, 0),
      isRefined: true,
      source: 'user_refined',
      createdAt: now,
      updatedAt: now
    });

    alternatives.push({
      id: `idea_ref_${Date.now()}_2`,
      title: `Streamlined ${baseIdea?.title || 'Alternative'} with Lower Complexity`,
      category: baseCategory,
      description: `A lighter, operational-friendly version addressing "${refinementPrompt}" with reduced logistical friction.`,
      whyItFits: `Delivers the creative intent of "${refinementPrompt}" with lower coordinator overhead.`,
      practicalConsiderations: [
        'Requires 50% less setup crew coordination',
        'Seamlessly integrated into existing vendor scopes',
        'Clean, stress-free execution on celebration day'
      ],
      budgetImpact: 'Likely low impact',
      budgetAssumptions: 'Focuses on layout and styling adjustments rather than new procurement.',
      tags: ['Low Complexity', 'Stress Free', 'Operationally Sound'],
      image: baseIdea?.image || getCategoryImage(baseCategory, 1),
      isRefined: true,
      source: 'user_refined',
      createdAt: now,
      updatedAt: now
    });
  }

  return alternatives;
}

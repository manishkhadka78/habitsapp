// Store settings and product catalog. Replace with an API call when a backend is added.
window.STORE = {
  name: "Austral Labs", // placeholder brand — change to your own
  currency: "AUD",
  freeShippingMin: 150,
  shipping: {
    standard: { label: "Standard (Australia Post, 3–6 business days)", price: 9.95 },
    express: { label: "Express (Australia Post, 1–3 business days)", price: 14.95 },
  },
  gstRate: 0.1, // prices are GST-inclusive
  dispatchCutoff: "2pm AEST",
};

// `label` (optional) is a short name printed on the vial art.
// Each product has one or more size variants with their own price and stock.
window.PRODUCTS = [
  { id: "bpc-157", name: "BPC-157", category: "Repair & Recovery", cap: "#2563eb", purity: 99.4, rating: 4.9, reviews: 212, bestseller: true,
    description: "BPC-157 is a synthetic 15-amino-acid peptide (pentadecapeptide) based on a partial sequence of body protection compound isolated from gastric juice.",
    variants: [{ size: "5mg", price: 69, stock: 48 }, { size: "10mg", price: 119, stock: 30 }] },
  { id: "tb-500", name: "TB-500", category: "Repair & Recovery", cap: "#0ea5e9", purity: 99.1, rating: 4.8, reviews: 164, bestseller: true,
    description: "TB-500 is a synthetic peptide fragment of thymosin beta-4, a 43-amino-acid actin-sequestering protein.",
    variants: [{ size: "5mg", price: 79, stock: 36 }, { size: "10mg", price: 139, stock: 22 }] },
  { id: "bpc-tb-blend", name: "BPC-157 / TB-500 Blend", label: "BPC + TB", category: "Repair & Recovery", cap: "#6366f1", purity: 99.0, rating: 4.9, reviews: 98, bestseller: true,
    description: "A pre-blended vial containing equal parts BPC-157 and TB-500 (5mg each), supplied as a single lyophilised powder.",
    variants: [{ size: "10mg", price: 149, stock: 18 }] },
  { id: "ghk-cu", name: "GHK-Cu", category: "Copper Peptides", cap: "#0d9488", purity: 99.6, rating: 4.8, reviews: 141, bestseller: true,
    description: "GHK-Cu is the copper(II) complex of the naturally occurring tripeptide glycyl-L-histidyl-L-lysine.",
    variants: [{ size: "50mg", price: 69, stock: 52 }, { size: "100mg", price: 109, stock: 27 }] },
  { id: "ipamorelin", name: "Ipamorelin", category: "GH Secretagogues", cap: "#7c3aed", purity: 99.2, rating: 4.7, reviews: 87,
    description: "Ipamorelin is a synthetic pentapeptide and selective agonist of the ghrelin receptor (GHS-R1a).",
    variants: [{ size: "5mg", price: 59, stock: 40 }, { size: "10mg", price: 99, stock: 15 }] },
  { id: "cjc-1295", name: "CJC-1295 (no DAC)", category: "GH Secretagogues", cap: "#9333ea", purity: 99.0, rating: 4.6, reviews: 66,
    description: "CJC-1295 without DAC, also known as Modified GRF (1-29), is a 29-amino-acid analogue of growth hormone-releasing hormone.",
    variants: [{ size: "5mg", price: 79, stock: 24 }] },
  { id: "epithalon", name: "Epithalon", category: "Longevity", cap: "#d97706", purity: 99.3, rating: 4.7, reviews: 73,
    description: "Epithalon (Epitalon) is a synthetic tetrapeptide with the sequence Ala-Glu-Asp-Gly.",
    variants: [{ size: "10mg", price: 59, stock: 44 }, { size: "50mg", price: 189, stock: 8 }] },
  { id: "mots-c", name: "MOTS-c", category: "Longevity", cap: "#ea580c", purity: 99.1, rating: 4.6, reviews: 41,
    description: "MOTS-c is a 16-amino-acid peptide encoded in the mitochondrial genome (12S rRNA region).",
    variants: [{ size: "10mg", price: 99, stock: 19 }] },
  { id: "nad-plus", name: "NAD+", category: "Longevity", cap: "#dc2626", purity: 99.5, rating: 4.8, reviews: 58,
    description: "Nicotinamide adenine dinucleotide (NAD+), a coenzyme central to cellular redox reactions, supplied lyophilised.",
    variants: [{ size: "500mg", price: 129, stock: 33 }] },
  { id: "selank", name: "Selank", category: "Neuro Peptides", cap: "#16a34a", purity: 99.2, rating: 4.5, reviews: 39,
    description: "Selank is a synthetic heptapeptide analogue of the immunomodulatory peptide tuftsin.",
    variants: [{ size: "5mg", price: 65, stock: 28 }] },
  { id: "semax", name: "Semax", category: "Neuro Peptides", cap: "#059669", purity: 99.0, rating: 4.5, reviews: 35,
    description: "Semax is a synthetic heptapeptide derived from the adrenocorticotropic hormone fragment ACTH(4-10).",
    variants: [{ size: "5mg", price: 65, stock: 0 }] },
];

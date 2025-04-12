const companyToSymbol = {
    // Indian IT Companies
    "Tata Consultancy Services": "TCS",
    "TCS": "TCS",
    "Infosys": "INFY",
    "Wipro": "WIPRO",
    "HCL Technologies": "HCLTECH",
    "Tech Mahindra": "TECHM",
    "L&T Infotech": "LTI",
    "Mindtree": "MINDTREE",
    "Mphasis": "MPHASIS",
    "Oracle Financial Services": "OFSS",
    "Coforge": "COFORGE",

};

export const SymbolConvertor = (company) => {
    try {
        const normalizedCompany = company.trim().toUpperCase();
        const symbol = Object.entries(companyToSymbol).find(
            ([key]) => key.toUpperCase() === normalizedCompany
        );
        if (symbol) {
            return symbol[1]; 
        }
        const partialMatch = Object.entries(companyToSymbol).find(
            ([key]) => normalizedCompany.includes(key.toUpperCase()) || 
                      key.toUpperCase().includes(normalizedCompany)
        );
        if (partialMatch) {
            return partialMatch[1];
        }
        throw new Error('Company not found in our database');
    } catch (error) {
        throw new Error('Company not found in our database');
    }
};
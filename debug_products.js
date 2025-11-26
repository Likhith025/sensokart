

async function checkProducts() {
    try {
        console.log('Fetching with ?limit=20&sortBy=priority&sortOrder=asc');
        const response = await fetch('http://localhost:5000/api/products?limit=20&sortBy=priority&sortOrder=asc');
        const data = await response.json();
        const products = data.products || data;

        console.log('--- API Response Order ---');
        products.forEach((p, i) => {
            console.log(`${i + 1}. [${p.priority} (${typeof p.priority})] ${p.name}`);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

checkProducts();

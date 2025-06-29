export const wxai = async (customTopic) => {
  try {
    const res = await fetch("http://localhost:5001/api/summarise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customTopic }),
    });

    const data = await res.json();
    // console.log("anseer from ai", data)
    return data;
  } catch (err) {
    return { error: err.message };
  }
};

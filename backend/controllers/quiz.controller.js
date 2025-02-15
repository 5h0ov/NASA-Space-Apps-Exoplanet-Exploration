import axios from "axios";
import CryptoJS from "crypto-js";
import { ENV_VARS } from "../config/envVar.js";

const SECRET_KEY = ENV_VARS.SECRET_KEY;

export async function getQuizQuestions(req, res) {
  const { planetName } = req.params;
  const page = req.query.page || 1;

  const url = `https://science.nasa.gov/wp-json/smd/v1/content-list/?requesting_id=199043&post_types=exoplanet&categories&internal_terms&mission_status&mission_type&mission_target&mission_programs&news_tags&meta_fields=%7B%7D&exclude_child_pages=false&order=DESC&orderby=date&science_only=false&search_query=${planetName}&current_page=${page}&number_of_items=15&layout=grid&listing_page_category_id=0`;

  try {
    const response = await axios.get(url);
    const items = response.data.value.items;

    if (items.length > 1) {
      const exactMatch = items.find(
        (item) => item.title.toLowerCase() === planetName.toLowerCase()
      );
      // console.log('Exact Match:', exactMatch);
      if (exactMatch) {
        const hash = CryptoJS.SHA256(JSON.stringify(exactMatch)).toString();

        // Encrypt the data
        const encryptedData = CryptoJS.AES.encrypt(
          JSON.stringify({ exactMatch, hash }),
          SECRET_KEY
        ).toString();

        return res.json({ data: encryptedData });
      } else {
        return res.json({
          message: "Multiple planets found, Choose a Specific one:",
          planets: items,
        });
      }
    }

    const quizData = items[0];
    // Hash the data
    const hash = CryptoJS.SHA256(JSON.stringify(quizData)).toString();

    // Encrypt the data
    const encryptedData = CryptoJS.AES.encrypt(
      JSON.stringify({ quizData, hash }),
      SECRET_KEY
    ).toString();

    console.log("Encrypted Data:", encryptedData);

    return res.json({ data: encryptedData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Pagination from "../components/Pagination.jsx";
import axios from "axios";
import { FaRegHeart } from "react-icons/fa";
import { useStore } from "../store/store.js";
import { toast } from "react-toastify";
import { Tooltip } from "react-tooltip";

const API_URL = import.meta.env.VITE_BACKEND_URL;

const Planets = () => {
  const { user } = useStore();
  const [planets, setPlanets] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(16); // Number of items from NASA API
  const [totalPages, setTotalPages] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [favourites, setFavourites] = useState(() => {
    const savedFavourites = localStorage.getItem("favourite-planets");
    return savedFavourites ? JSON.parse(savedFavourites) : [];
  });
  const fetchPlanets = async () => {
    const url = `https://science.nasa.gov/wp-json/smd/v1/content-list/?requesting_id=199043&post_types=exoplanet&categories&internal_terms&mission_status&mission_type&mission_target&mission_programs&news_tags&meta_fields=%7B%7D&exclude_child_pages=false&order=DESC&orderby=date&science_only=false&search_query=${searchQuery}&current_page=${currentPage}&number_of_items=${itemsPerPage}&layout=grid&listing_page_category_id=0`;

    setIsLoading(true);

    try {
      const response = await axios.get(url);
      console.log("Planets:", response.data);
      setPlanets(response.data.value.items); // Get the items array
      // const totalCount = await axios.get(`${API_URL}/api/planets/count`);
      setTotalPages(
        Math.ceil(response.data.value.pagination.found_posts / itemsPerPage)
      ); // Set total pages for pagination
      console.log(response.data.value.items.length);

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error("Error fetching planets:", error);
    }
  };

  useEffect(() => {
    // NASA API URL with dynamic page
    fetchPlanets();
  }, [currentPage, itemsPerPage, searchQuery]);

  const handleResize = () => {
    setIsMobile(window.innerWidth < 768);
  };
  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleItemsPerPageChange = (event) => {
    setItemsPerPage(event.target.value);
    setCurrentPage(1); // Reset to first page when itemsPerPage changes
  };

  const handleAddFavourite = (planet) => {
    try {
      setIsLoading(true);
      const payload = {
        title: planet.title,
        thumbnailImg: planet.thumbnailImg?.url,
        excerpt: planet.excerpt,
        permalink: planet.permalink,
      };

      if (favourites.some((fav) => fav.title === payload.title)) {
        setIsLoading(false);
        toast.error("Already in favourites!");
        console.log("Already in favourites!");
        return;
      }
      const updatedFavourites = [...favourites, payload];
      setFavourites(updatedFavourites);
      localStorage.setItem(
        "favourite-planets",
        JSON.stringify(updatedFavourites)
      );
      setIsLoading(false);
      toast.success("Added to favourites!");
    } catch (error) {
      setIsLoading(false);
      console.error("Error adding favourite:", error);
      toast.error("Error adding to favourites!");
    }
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
    window.scroll({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1); // Reset to first page when search query changes
    fetchPlanets();
  };
  const handlePlanetClick = (planet) => {
    localStorage.setItem("selectedPlanet", JSON.stringify(planet));
  };

  return (
    <>
      <div className=" text-white min-h-screen pb-5">
        <div className="video-wrapper">
          <video src="/homebgvideo.mp4" autoPlay muted loop></video>
        </div>
        <Navbar />
        {/* Dropdown to change items per page */}
        <div className="flex flex-col sm:flex-row gap-2 items-center justify-center my-4 font-semibold">
          <div className="flex flex-col sm:flex-row">
            <label className="mr-2 text-lg">Showing</label>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="border rounded px-2 py-1 bg-slate-800"
            >
              <option value={4}>4</option>
              <option value={8}>8</option>
              <option value={16}>16</option>
              <option value={32}>32</option>
              <option value={64}>64</option>
              <option value={128}>128</option>
            </select>
            <span className="ml-2 text-lg">Exoplanets per page!</span>
          </div>
          <div>
            <input
              type="text"
              placeholder="Search Exoplanets"
              className="border rounded px-2 py-1 bg-slate-800 ml-4"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          isMobile={isMobile}
          handlePageChange={handlePageChange}
          isLoading={isLoading}
          searchQuery={searchQuery}
          itemsPerPage={itemsPerPage}
        />

        {isLoading ? (
          <div className="text-center text-2xl mt-4">Loading...</div>
        ) : (
          <div className="flex flex-wrap justify-center mt-4">
            {planets.map((planet, index) => (
              <Link
                to={`/planetintermediate/${planet.title}`}
                key={index}
                onClick={() => handlePlanetClick(planet)}
                className="bg-opacity-20 rounded-lg m-2 p-8 group text-center shadow-lg hover:bg-slate-800/80 transition-all duration-150 hover:scale-105 active:scale-95"
              >
                <div className="h-36 bg-white bg-opacity-20 rounded-lg mb-2">
                  {planet.thumbnailImg?.url ? (
                    <img
                      src={planet.thumbnailImg.url}
                      alt={planet.title}
                      className="h-full w-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-500">
                      No Image
                    </div>
                  )}
                </div>
                <h2 className="text-3xl font-semibold">{planet.title}</h2>
                <FaRegHeart
                  id="add"
                  className="absolute  size-10 top-2 right-2 text-gray-500 hover:text-red-500 
                        hover:scale-110 opacity-0 
                        transition-all duration-100 group-hover:opacity-100 "
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddFavourite(planet);
                  }}
                />
                <Tooltip
                  anchorSelect="#add"
                  place="top"
                  content="Add to Favourites"
                />
              </Link>
            ))}

            {planets.length === 0 && (
              <div className="text-center text-3xl">No planets found!</div>
            )}
          </div>
        )}
        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          isMobile={isMobile}
          handlePageChange={handlePageChange}
          isLoading={isLoading}
          searchQuery={searchQuery}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </>
  );
};

export default Planets;

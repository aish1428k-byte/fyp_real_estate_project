// // src/context/UserContext.jsx

// import { createContext, useContext, useEffect, useState } from "react";

// const UserContext = createContext();

// export const UserProvider = ({ children }) => {
//   const [userInfo, setUserInfo] = useState(null);
//   const token = localStorage.getItem("access");

//   useEffect(() => {
//     const fetchProfile = async () => {
//       try {
//         const response = await fetch(
//           "http://127.0.0.1:8000/users/profile/me/",
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           }
//         );

//         const data = await response.json();
//         setUserInfo(data);
//       } catch (err) {
//         console.log(err);
//       }
//     };

//     if (token) {
//       fetchProfile();
//     }
//   }, [token]);

//   return (
//     <UserContext.Provider value={{ userInfo, setUserInfo }}>
//       {children}
//     </UserContext.Provider>
//   );
// };

// export const useUser = () => useContext(UserContext);



// src/context/UserContext.jsx
// src/components/UserContext.jsx

import { createContext, useContext, useEffect, useState } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("access");

      if (!token) {
        setUserInfo(null);
        return;
      }

      const response = await fetch(
        "http://127.0.0.1:8000/users/profile/me/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();

      console.log("CURRENT LOGGED-IN USER:", data);

      setUserInfo(data);

    } catch (err) {
      console.error("Profile fetch error:", err);
      setUserInfo(null);
    }
  };

  useEffect(() => {
    // Initial profile load
    fetchProfile();

    // Login/logout ke baad profile refresh
    const handleAuthChange = () => {
      fetchProfile();
    };

    window.addEventListener("authChanged", handleAuthChange);

    return () => {
      window.removeEventListener("authChanged", handleAuthChange);
    };
  }, []);

  return (
    <UserContext.Provider
      value={{
        userInfo,
        setUserInfo,
        fetchProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
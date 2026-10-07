import React from "react";
import { useUser } from "./UserContext";

const MyProfile = () => {
  const { userInfo } = useUser();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-light)",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {userInfo?.profile_picture ? (
          <img
            src={userInfo.profile_picture}
            alt=""
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ width: "20px", height: "20px" }}
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontWeight: "600",
            fontSize: "14px",
            color: "white",
          }}
        >
          {userInfo?.name || "Loading..."}
        </span>

        <span
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
          }}
        >
          {userInfo?.role || ""}
        </span>
      </div>
    </div>
  );
};

export default MyProfile;
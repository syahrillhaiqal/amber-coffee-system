import { Outlet } from "react-router-dom";
import Navbar from "./Navbar"; 

export default function StudentLayout() {
    return (
        <>
            {/* Student Navbar only appears here */}
            <Navbar />
            <div className="">
                <Outlet />
            </div>
        </>
    );
}
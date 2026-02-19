import { Outlet } from "react-router-dom";
import Navbar from "./Navbar"; 

export default function StudentLayout() {
    return (
        <>
            <Navbar />
            <div className="">
                <Outlet />
            </div>
        </>
    );
}
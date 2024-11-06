import TopBar from "./../../components/TopBar";

export default function Home() {
  return (
    <>
      <TopBar />
      {/** NavBar Start  */}
      {/** Nav Bar end */}

      {/** Main Content Start */}
      <div className="p-5">
        <p>Welcome to the Home Page!</p>
      </div>
      {/** Main Content End */}
    </>
  );
}

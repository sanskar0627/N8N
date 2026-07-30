import { RegisterForm } from "@/features/auth/components/Register-form";
import { requireUnAuth } from "@/lib/auth-utils";
 
 const page=async ()=>{
    await requireUnAuth();
    return(
        <div>
            <RegisterForm>
                
            </RegisterForm>
        </div>
    )
}
export default page;

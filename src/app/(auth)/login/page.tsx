import { LoginForm } from "@/features/auth/components/login-form";
import { requireUnAuth } from "@/lib/auth-utils";

const loginpage= async ()=>{
    await requireUnAuth();
    return(
        <div>
           <LoginForm></LoginForm>
        </div>
    )
}

export default loginpage;